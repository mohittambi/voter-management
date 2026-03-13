import 'regenerator-runtime/runtime';
import { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import { getServiceRoleClient } from '../../../../lib/supabaseClient';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;
const HEADER_HEIGHT = 60;
const SECTION_GAP = 16;
const TABLE_COL_LABEL = 120;
const CELL_PADDING = 8;
const ROW_HEIGHT = 22;
const BORDER = 0.5;
const BORDER_COLOR = rgb(0.88, 0.89, 0.91);
const HEADER_BG = rgb(0.06, 0.09, 0.16);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.98, 0.985, 0.99);

/** Devanagari script range (U+0900–U+097F) */
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
  opts: { size: number; font: PDFFont; fontDevanagari: PDFFont; color?: RGB }
): number {
  const { size, font, fontDevanagari, color } = opts;
  let curX = x;
  for (const seg of splitByScript(text)) {
    const f = seg.devanagari ? fontDevanagari : font;
    page.drawText(seg.text, { x: curX, y, size, font: f, color });
    curX += f.widthOfTextAtSize(seg.text, size);
  }
  return curX - x;
}

function widthOfText(text: string, font: PDFFont, fontDev: PDFFont, size: number): number {
  let w = 0;
  for (const seg of splitByScript(text)) {
    const f = seg.devanagari ? fontDev : font;
    w += f.widthOfTextAtSize(seg.text, size);
  }
  return w;
}

function wrapText(text: string, maxWidth: number, font: PDFFont, fontDev: PDFFont, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = widthOfText(test, font, fontDev, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

type TableOpts = {
  font: PDFFont;
  fontBold: PDFFont;
  fontDev: PDFFont;
  size?: number;
};

function truncateToWidth(text: string, maxWidth: number, font: PDFFont, fontDev: PDFFont, size: number): string {
  if (widthOfText(text, font, fontDev, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && widthOfText(t + '…', font, fontDev, size) > maxWidth) t = t.slice(0, -1);
  return t ? t + '…' : '…';
}

function drawTableRow(
  page: PDFPage,
  x: number,
  y: number,
  colWidths: number[],
  cells: string[],
  opts: TableOpts & { header?: boolean; alt?: boolean; useMixed?: boolean }
): number {
  const { font, fontBold, fontDev, header, alt, useMixed } = opts;
  const size = opts.size ?? 10;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const cellHeight = ROW_HEIGHT;

  if (header) {
    page.drawRectangle({ x, y: y - cellHeight, width: tableWidth, height: cellHeight, color: HEADER_BG });
  } else if (alt) {
    page.drawRectangle({ x, y: y - cellHeight, width: tableWidth, height: cellHeight, color: ROW_ALT_BG });
  }

  let curX = x;
  const textY = y - cellHeight + CELL_PADDING + 2;
  const textColor = header ? HEADER_TEXT : rgb(0.2, 0.25, 0.35);

  for (let i = 0; i < cells.length; i++) {
    const cw = colWidths[i];
    const innerW = cw - 2 * CELL_PADDING;
    const cellText = truncateToWidth(cells[i], innerW, font, fontDev, size);
    const drawFont = header ? fontBold : font;

    if (useMixed && /[\u0900-\u097f]/.test(cellText)) {
      drawTextMixed(page, cellText, curX + CELL_PADDING, textY, {
        size,
        font: drawFont,
        fontDevanagari: fontDev,
        color: textColor,
      });
    } else {
      page.drawText(cellText, {
        x: curX + CELL_PADDING,
        y: textY,
        size,
        font: drawFont,
        color: textColor,
      });
    }
    curX += cw;
  }

  page.drawRectangle({
    x,
    y: y - cellHeight,
    width: tableWidth,
    height: BORDER,
    color: BORDER_COLOR,
  });
  return cellHeight;
}

function drawTable(
  page: PDFPage,
  x: number,
  y: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  opts: TableOpts
): number {
  let curY = y;
  drawTableRow(page, x, curY, colWidths, headers, { ...opts, header: true });
  curY -= ROW_HEIGHT;
  for (let i = 0; i < rows.length; i++) {
    curY -= drawTableRow(page, x, curY, colWidths, rows[i], {
      ...opts,
      alt: i % 2 === 1,
      useMixed: true,
    });
  }
  const totalHeight = ROW_HEIGHT + rows.length * ROW_HEIGHT;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  page.drawRectangle({
    x: x - BORDER,
    y: curY - BORDER,
    width: tableWidth + 2 * BORDER,
    height: totalHeight + 2 * BORDER,
    borderColor: BORDER_COLOR,
    borderWidth: BORDER,
  });
  let curX = x;
  for (let i = 0; i < colWidths.length - 1; i++) {
    curX += colWidths[i];
    page.drawRectangle({
      x: curX,
      y: curY - BORDER,
      width: BORDER,
      height: totalHeight + 2 * BORDER,
      color: BORDER_COLOR,
    });
  }
  return totalHeight + 2 * BORDER;
}

function drawSingleColumnTable(
  page: PDFPage,
  x: number,
  y: number,
  title: string,
  notesText: string,
  tableWidth: number,
  opts: TableOpts
): number {
  const colWidths = [tableWidth];
  const headerRow = ['Notes'];
  let curY = y;
  page.drawText(title, { x, y: curY, size: 12, font: opts.fontBold, color: rgb(0.1, 0.2, 0.4) });
  curY -= 18;
  drawTableRow(page, x, curY, colWidths, headerRow, { ...opts, header: true });
  curY -= ROW_HEIGHT;
  const lines = notesText.trim()
    ? wrapText(notesText, tableWidth - 2 * CELL_PADDING, opts.font, opts.fontDev, 10)
    : ['—'];
  const lineHeight = 13;
  const contentHeight = Math.max(ROW_HEIGHT, Math.min(lines.length, 15) * lineHeight);
  page.drawRectangle({ x, y: curY - contentHeight, width: tableWidth, height: contentHeight, color: ROW_ALT_BG });
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i].substring(0, 90);
    if (/[\u0900-\u097f]/.test(line)) {
      drawTextMixed(page, line, x + CELL_PADDING, curY - 10 - i * lineHeight, {
        size: 10,
        font: opts.font,
        fontDevanagari: opts.fontDev,
      });
    } else {
      page.drawText(line, { x: x + CELL_PADDING, y: curY - 10 - i * lineHeight, size: 10, font: opts.font });
    }
  }
  page.drawRectangle({ x, y: curY - contentHeight, width: tableWidth, height: BORDER, color: BORDER_COLOR });
  const totalH = ROW_HEIGHT + contentHeight + 2 * BORDER;
  page.drawRectangle({
    x: x - BORDER,
    y: curY - contentHeight - 2 * BORDER,
    width: tableWidth + 2 * BORDER,
    height: totalH,
    borderColor: BORDER_COLOR,
    borderWidth: BORDER,
  });
  return 18 + totalH;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const supabase = getServiceRoleClient();
    const { data: sr, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        status,
        notes,
        created_at,
        updated_at,
        master_voters(
          voter_id,
          name_english,
          name_marathi,
          first_name,
          surname,
          voter_profiles(mobile, village)
        ),
        service_types(name),
        service_request_status_logs(id, status, changed_at)
      `)
      .eq('id', id)
      .single();

    if (error || !sr) return res.status(404).json({ error: 'Service request not found' });

    const voter = Array.isArray(sr.master_voters) ? sr.master_voters[0] : sr.master_voters;
    const st = Array.isArray(sr.service_types) ? sr.service_types[0] : sr.service_types;
    const profile = Array.isArray((voter as any)?.voter_profiles) ? (voter as any).voter_profiles[0] : (voter as any)?.voter_profiles;

    const voterNameEn = (voter as any)?.name_english || `${(voter as any)?.first_name || ''} ${(voter as any)?.surname || ''}`.trim() || '—';
    const voterNameMr = (voter as any)?.name_marathi || '—';
    const voterId = (voter as any)?.voter_id || '—';
    const village = profile?.village || '—';
    const mobile = profile?.mobile || '—';
    const serviceType = (st as any)?.name || '—';
    const status = sr.status || '—';
    const createdDate = sr.created_at ? new Date(sr.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const updatedDate = sr.updated_at ? new Date(sr.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const notes = sr.notes || '—';

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(
      process.cwd(),
      'node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff'
    );
    const fontDevanagariBytes = fs.readFileSync(fontPath);
    const fontDevanagari = await pdfDoc.embedFont(fontDevanagariBytes, { subset: true });

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const contentWidth = A4_WIDTH - 2 * MARGIN;
    const tableWidth = contentWidth;
    const colLabel = TABLE_COL_LABEL;
    const colValue = tableWidth - TABLE_COL_LABEL;
    const tableOpts: TableOpts = { font, fontBold, fontDev: fontDevanagari };
    let y = A4_HEIGHT - HEADER_HEIGHT - 24;

    // Header bar - light blue
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
    page.drawText('Service Request', {
      x: MARGIN,
      y: A4_HEIGHT - 52,
      size: 11,
      font,
      color: rgb(0.3, 0.4, 0.5),
    });

    // Table 1: Request ID
    page.drawText('Request Information', { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
    y -= 18;
    const reqIdTableH = drawTable(
      page,
      MARGIN,
      y,
      ['Field', 'Value'],
      [['Request ID', sr.id]],
      [colLabel, colValue],
      tableOpts
    );
    y -= reqIdTableH + SECTION_GAP;

    // Table 2: Voter Details
    page.drawText('Voter Details', { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
    y -= 18;
    const voterTableH = drawTable(
      page,
      MARGIN,
      y,
      ['Field', 'Value'],
      [
        ['Name (English)', voterNameEn],
        ['Name (Marathi)', voterNameMr],
        ['Voter ID (EPIC)', voterId],
        ['Village', village],
        ['Mobile', mobile],
      ],
      [colLabel, colValue],
      tableOpts
    );
    y -= voterTableH + SECTION_GAP;

    // Table 3: Service Information
    page.drawText('Service Information', { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
    y -= 18;
    const serviceTableH = drawTable(
      page,
      MARGIN,
      y,
      ['Field', 'Value'],
      [
        ['Service Type', serviceType],
        ['Status', status],
        ['Date Raised', createdDate],
        ['Last Updated', updatedDate],
      ],
      [colLabel, colValue],
      tableOpts
    );
    y -= serviceTableH + SECTION_GAP;

    // Table 4: Application Progress
    page.drawText('Application Progress', { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
    y -= 18;
    const logs: any[] = Array.isArray(sr.service_request_status_logs) ? sr.service_request_status_logs : [];
    const sortedLogs = [...logs].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
    const progressRows: string[][] =
      sortedLogs.length > 0
        ? sortedLogs.slice(0, 10).map((log, i) => {
            const logDate = new Date(log.changed_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            return [`${i + 1}`, log.status, logDate];
          })
        : [['1', `${status} (since creation)`, createdDate]];
    const colProgress = [24, tableWidth - 24 - 120, 120];
    const progressTableH = drawTable(
      page,
      MARGIN,
      y,
      ['#', 'Status', 'Date & Time'],
      progressRows,
      colProgress,
      tableOpts
    );
    y -= progressTableH + SECTION_GAP;

    // Table 5: Notes
    const notesTableH = drawSingleColumnTable(page, MARGIN, y, 'Notes', notes, tableWidth, tableOpts);
    y -= notesTableH;

    // Footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: 35,
      color: rgb(0.96, 0.97, 0.98),
    });
    page.drawText(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, {
      x: MARGIN,
      y: 18,
      size: 9,
      font,
      color: rgb(0.4, 0.45, 0.5),
    });
    page.drawText('Vedant Info', {
      x: A4_WIDTH - MARGIN - 60,
      y: 18,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.28, 0.63),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="VedantInfo-ServiceRequest-${sr.id}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to generate PDF' });
  }
}
