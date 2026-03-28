import 'regenerator-runtime/runtime';
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { PDFDocument } from 'pdf-lib';

const LETTERHEAD_FILENAME = 'letterhead-birthday.pdf';

/** Full TTF from Google Fonts (Latin + Devanagari) — used by Skia/HarfBuzz on canvas, not pdf-lib drawText. */
const ANEK_FULL_TTF = 'anek-devanagari-700-full.ttf';

const CANVAS_FONT_FAMILY = 'AnekBirthday';

/**
 * Default distance from the physical top of the page (pt) down to the top edge of the overlay PNG.
 * Larger value = block sits lower on the page, closer to the “आपणास …” body line.
 */
const DEFAULT_GREETING_TOP_FROM_PAGE_TOP_PT = 290;

/** Default left edge of overlay (pt); align with letterhead body gutter (smaller = further left). */
const DEFAULT_GREETING_X_PT = 28;

let canvasFontRegisteredPath: string | null = null;

function resolveLetterheadPath(): string {
  const envPath = process.env.BIRTHDAY_LETTERHEAD_PDF_PATH?.trim();
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
  }
  const inWebAssets = path.join(process.cwd(), 'assets', LETTERHEAD_FILENAME);
  if (fs.existsSync(inWebAssets)) return inWebAssets;
  const repoRoot = path.join(process.cwd(), '..', 'LETTER HEAD FINAL (1).pdf');
  if (fs.existsSync(repoRoot)) return repoRoot;
  return inWebAssets;
}

function resolveAnekFullFontPath(): string {
  return path.join(process.cwd(), 'public', 'fonts', ANEK_FULL_TTF);
}

function parseCoord(envVal: string | undefined, fallback: number): number {
  if (envVal === undefined || envVal === '') return fallback;
  const n = Number.parseFloat(envVal);
  return Number.isFinite(n) ? n : fallback;
}

function ensureCanvasFont(fontPath: string): void {
  if (canvasFontRegisteredPath === fontPath) return;
  const key = GlobalFonts.registerFromPath(fontPath, CANVAS_FONT_FAMILY);
  if (!key) {
    throw new Error(`Failed to register canvas font from ${fontPath}`);
  }
  canvasFontRegisteredPath = fontPath;
}

/**
 * Renders Devanagari lines with correct shaping (Skia). pdf-lib drawText is unreliable for Indic scripts.
 */
function renderGreetingPng(
  lines: string[],
  fontPath: string,
  canvasFontPx: number,
  lineHeightCanvasPx: number
): Buffer {
  ensureCanvasFont(fontPath);

  const padX = 0;
  const padTop = 6;
  const padBottom = 8;

  const probe = createCanvas(8, 8).getContext('2d');
  probe.font = `bold ${canvasFontPx}px ${CANVAS_FONT_FAMILY}`;

  let textW = 0;
  for (const line of lines) {
    textW = Math.max(textW, probe.measureText(line).width);
  }
  const canvasW = Math.max(64, Math.ceil(textW + padX * 2));

  const n = lines.length;
  const firstBaselineY = padTop + canvasFontPx;
  const canvasH = Math.ceil(firstBaselineY + (n - 1) * lineHeightCanvasPx + padBottom);

  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${canvasFontPx}px ${CANVAS_FONT_FAMILY}`;
  ctx.fillStyle = '#1a1a26';
  ctx.textBaseline = 'alphabetic';

  lines.forEach((line, i) => {
    ctx.fillText(line, padX, firstBaselineY + i * lineHeightCanvasPx);
  });

  return canvas.toBuffer('image/png');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id: voterId } = req.query as { id: string };
  if (!voterId) return res.status(400).json({ error: 'id (voter_id) required' });

  const templatePath = resolveLetterheadPath();
  if (!fs.existsSync(templatePath)) {
    console.error('[birthday-pdf] Letterhead template missing:', templatePath);
    return res.status(500).json({
      error: 'Birthday letterhead template not found. Set BIRTHDAY_LETTERHEAD_PDF_PATH or add web/assets/letterhead-birthday.pdf',
    });
  }

  const fontPath = resolveAnekFullFontPath();
  if (!fs.existsSync(fontPath)) {
    console.error('[birthday-pdf] Anek full TTF missing:', fontPath);
    return res.status(500).json({
      error: `Missing ${ANEK_FULL_TTF} under public/fonts/ (full Anek Devanagari Bold from Google Fonts).`,
    });
  }

  try {
    const supabase = getServiceRoleClient();
    const { data: voter, error } = await supabase
      .from('master_voters')
      .select(
        `id, name_english, name_marathi, first_name, middle_name, surname,
        voter_profiles!voter_profiles_voter_id_fkey(village)`
      )
      .eq('id', voterId)
      .single();
    if (error || !voter) return res.status(404).json({ error: 'Voter not found' });

    const vpRaw = (voter as any).voter_profiles;
    const vp = Array.isArray(vpRaw) ? vpRaw[0] : vpRaw;
    const village = String(vp?.village ?? '').trim();

    const nameMr =
      (voter as any).name_marathi ||
      [(voter as any).first_name, (voter as any).middle_name, (voter as any).surname].filter(Boolean).join(' ') ||
      (voter as any).name_english ||
      'मित्र';
    const nameEn =
      (voter as any).name_english ||
      [(voter as any).first_name, (voter as any).middle_name, (voter as any).surname].filter(Boolean).join(' ') ||
      'Friend';

    /** Default ~34px canvas → ~17pt on page at 0.5 scale; closer to letterhead body weight. */
    const canvasFontPx = parseCoord(process.env.BIRTHDAY_GREETING_CANVAS_PX, 34);
    const lineHeightCanvasPx = parseCoord(
      process.env.BIRTHDAY_GREETING_CANVAS_LINE_PX,
      Math.round(canvasFontPx * 1.35)
    );

    const greetingLines = ['प्रति,', nameMr];
    if (village) greetingLines.push(village);
    const pngBuffer = renderGreetingPng(greetingLines, fontPath, canvasFontPx, lineHeightCanvasPx);

    const templateBytes = fs.readFileSync(templatePath);
    const templateDoc = await PDFDocument.load(templateBytes);
    const pdfDoc = await PDFDocument.create();

    const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
    pdfDoc.addPage(templatePage);
    const page = pdfDoc.getPage(0);
    const { height: pageHeight } = page.getSize();

    const pngImage = await pdfDoc.embedPng(pngBuffer);
    const imgW = pngImage.width;
    const imgH = pngImage.height;

    const imageScale = parseCoord(process.env.BIRTHDAY_GREETING_IMAGE_SCALE, 0.5);
    const drawW = imgW * imageScale;
    const drawH = imgH * imageScale;

    const textX = parseCoord(process.env.BIRTHDAY_GREETING_X, DEFAULT_GREETING_X_PT);

    const topFromPageTopPt = parseCoord(
      process.env.BIRTHDAY_GREETING_TOP_FROM_PAGE_TOP_PT,
      DEFAULT_GREETING_TOP_FROM_PAGE_TOP_PT
    );
    const anchorY = process.env.BIRTHDAY_GREETING_Y?.trim()
      ? parseCoord(process.env.BIRTHDAY_GREETING_Y, pageHeight - topFromPageTopPt)
      : pageHeight - topFromPageTopPt;

    page.drawImage(pngImage, {
      x: textX,
      y: anchorY - drawH,
      width: drawW,
      height: drawH,
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="VedantInfo-Birthday-${nameEn.replaceAll(/[^a-zA-Z0-9]/g, '_')}.pdf"`
    );
    return res.send(Buffer.from(pdfBytes));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'PDF generation failed' });
  }
}
