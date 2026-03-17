import 'regenerator-runtime/runtime';
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;
const HEADER_HEIGHT = 60;

function isDevanagari(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0x0900 && code <= 0x097f;
}

function splitByScript(text: string): { text: string; devanagari: boolean }[] {
  const segments: { text: string; devanagari: boolean }[] = [];
  let current = '';
  let currentDevanagari: boolean | null = null;
  for (const char of text) {
    const dev = isDevanagari(char);
    if (currentDevanagari !== dev && current) {
      segments.push({ text: current, devanagari: currentDevanagari! });
      current = '';
    }
    currentDevanagari = dev;
    current += char;
  }
  if (current) segments.push({ text: current, devanagari: currentDevanagari! });
  return segments;
}

function drawTextMixed(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { size: number; font: PDFFont; fontDevanagari: PDFFont; color?: ReturnType<typeof rgb> }
): void {
  const { size, font, fontDevanagari, color } = opts;
  let curX = x;
  for (const seg of splitByScript(text)) {
    const f = seg.devanagari ? fontDevanagari : font;
    page.drawText(seg.text, { x: curX, y, size, font: f, color });
    curX += f.widthOfTextAtSize(seg.text, size);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id: voterId } = req.query as { id: string };
  if (!voterId) return res.status(400).json({ error: 'id (voter_id) required' });

  try {
    const supabase = getServiceRoleClient();
    const { data: voter, error } = await supabase
      .from('master_voters')
      .select('id, name_english, name_marathi, first_name, middle_name, surname')
      .eq('id', voterId)
      .single();
    if (error || !voter) return res.status(404).json({ error: 'Voter not found' });

    const nameMr = (voter as any).name_marathi || [((voter as any).first_name), (voter as any).middle_name, (voter as any).surname].filter(Boolean).join(' ') || (voter as any).name_english || 'मित्र';
    const nameEn = (voter as any).name_english || [((voter as any).first_name), (voter as any).middle_name, (voter as any).surname].filter(Boolean).join(' ') || 'Friend';
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'noto-sans-devanagari-devanagari-400-normal.woff');
    const fontDevanagariBytes = fs.readFileSync(fontPath);
    const fontDevanagari = await pdfDoc.embedFont(fontDevanagariBytes, { subset: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    let y = A4_HEIGHT - HEADER_HEIGHT - 20;

    page.drawRectangle({
      x: 0,
      y: A4_HEIGHT - HEADER_HEIGHT,
      width: A4_WIDTH,
      height: HEADER_HEIGHT,
      color: rgb(0.89, 0.94, 1),
    });
    page.drawText('Office - Vedant Info', {
      x: MARGIN,
      y: A4_HEIGHT - 38,
      size: 20,
      font: fontBold,
      color: rgb(0.05, 0.28, 0.63),
    });
    drawTextMixed(page, 'वाढदिवसाचे पत्र / Birthday Letter', MARGIN, A4_HEIGHT - 52, {
      size: 11,
      font,
      fontDevanagari,
      color: rgb(0.3, 0.4, 0.5),
    });

    y -= 24;
    drawTextMixed(page, `तारीख: ${dateStr}`, MARGIN, y, { size: 10, font, fontDevanagari, color: rgb(0.2, 0.2, 0.2) });
    y -= 28;

    drawTextMixed(page, `प्रिय ${nameMr} जी,`, MARGIN, y, { size: 14, font, fontDevanagari, color: rgb(0.1, 0.1, 0.2) });
    y -= 24;

    const bodyLines = [
      'Vedant Info कडून आपल्याला वाढदिवसाच्या हार्दिक शुभेच्छा!',
      'आपले आरोग्य, सुख आणि यशस्वी जीवन अशी आमची कामना आहे.',
      'आपला सहकार्य आणि विश्वास राहील यासाठी आम्ही प्रयत्नशील आहोत.',
      '',
      'धन्यवाद आणि शुभेच्छा,',
      'Vedant Info',
    ];
    for (const line of bodyLines) {
      if (line) drawTextMixed(page, line, MARGIN, y, { size: 12, font, fontDevanagari, color: rgb(0.15, 0.15, 0.2) });
      y -= 18;
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="VedantInfo-Birthday-${nameEn.replaceAll(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'PDF generation failed' });
  }
}
