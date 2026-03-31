/**
 * One-off import: final voter list XLSX → Supabase (service role).
 *
 * Column map (Sheet1 or --sheet name):
 *   EPIC_NUMBER → master_voters.voter_id (trim, uppercase)
 *   _L1 suffix = Marathi (Devanagari); columns without _L1 = English (Latin) in this workbook.
 *   APPLICANT_FULL_NAME → name_english
 *   APPLICANT_FIRST_NAME → first_name
 *   APPLICANT_LAST_NAME → surname
 *   APPLICANT_FULL_NAME_L1 → name_marathi
 *   APPLICANT_FIRST_NAME_L1 → first_name_marathi
 *   APPLICANT_LAST_NAME_L1 → surname_marathi
 *   AGE → age
 *   GENDER → gender
 *   RELATION_TYPE → voter_profiles.household_relation_code
 *
 * Rows with blank EPIC get placeholder voter_id NOEPIC-R{excelRow}; set real EPIC in the app.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
 *
 * Run from web/: node scripts/import-final-voter-list.mjs ../finalVoterList.xlsx
 * Optional: --sheet SheetName
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const BATCH = 300;

function parseArgs(argv) {
  let sheetName = null;
  const files = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--sheet' && argv[i + 1]) {
      sheetName = argv[++i];
      continue;
    }
    if (!argv[i].startsWith('-')) files.push(argv[i]);
  }
  return { file: files[0] || null, sheetName };
}

function normalizeVoterId(raw) {
  if (raw == null) return '';
  return String(raw).trim().toUpperCase();
}

/** Stable placeholder when the sheet has no EPIC; edit to real EPIC in the app — prefix NOEPIC-R */
function placeholderEpic(excelRow1Based, seen) {
  let epic = `NOEPIC-R${excelRow1Based}`;
  let n = 0;
  while (seen.has(epic)) {
    n += 1;
    epic = `NOEPIC-R${excelRow1Based}-${n}`;
  }
  seen.add(epic);
  return epic;
}

function cellStr(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function cellAge(v) {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseInt(String(v).trim(), 10);
  return Number.isFinite(n) ? n : null;
}

function getRowObjects(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  return rows;
}

async function main() {
  const { file: filepathArg, sheetName } = parseArgs(process.argv);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const defaultPath = path.resolve(process.cwd(), '../finalVoterList.xlsx');
  const filepath = filepathArg ? path.resolve(process.cwd(), filepathArg) : defaultPath;
  if (!fs.existsSync(filepath)) {
    console.error('File not found:', filepath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filepath);
  const sheet =
    sheetName != null
      ? workbook.Sheets[sheetName]
      : workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    console.error(sheetName ? `Sheet not found: ${sheetName}` : 'No sheets in workbook');
    process.exit(1);
  }

  const rows = getRowObjects(sheet);
  const supabase = createClient(url, key);

  let skippedDup = 0;
  let generatedEpic = 0;
  let profileErrors = 0;
  const seen = new Set();

  /** @type {{ voter_id: string, payload: object, relation: string|null }[]} */
  const staged = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const excelRow = i + 2;
    let epic = normalizeVoterId(r.EPIC_NUMBER);
    if (!epic) {
      epic = placeholderEpic(excelRow, seen);
      generatedEpic++;
    } else if (seen.has(epic)) {
      skippedDup++;
      console.warn(`Duplicate EPIC in file (skipped): ${epic} (row ~${excelRow})`);
      continue;
    } else {
      seen.add(epic);
    }

    const relation = cellStr(r.RELATION_TYPE);
    const payload = {
      voter_id: epic,
      name_english: cellStr(r.APPLICANT_FULL_NAME),
      first_name: cellStr(r.APPLICANT_FIRST_NAME),
      surname: cellStr(r.APPLICANT_LAST_NAME),
      name_marathi: cellStr(r.APPLICANT_FULL_NAME_L1),
      first_name_marathi: cellStr(r.APPLICANT_FIRST_NAME_L1),
      surname_marathi: cellStr(r.APPLICANT_LAST_NAME_L1),
      age: cellAge(r.AGE),
      gender: cellStr(r.GENDER),
    };

    staged.push({ voter_id: epic, payload, relation });
  }

  console.log(
    `Staged ${staged.length} rows (generated EPIC for empty cell: ${generatedEpic}, duplicate EPIC skipped: ${skippedDup})`
  );

  for (let i = 0; i < staged.length; i += BATCH) {
    const chunk = staged.slice(i, i + BATCH);
    const masterRows = chunk.map((c) => c.payload);

    const { data: upserted, error: mErr } = await supabase
      .from('master_voters')
      .upsert(masterRows, { onConflict: 'voter_id' })
      .select('id,voter_id');

    if (mErr) {
      console.error('master_voters upsert error:', mErr);
      process.exit(1);
    }

    const byEpic = new Map((upserted || []).map((row) => [row.voter_id, row.id]));

    const profiles = [];
    for (const item of chunk) {
      const uuid = byEpic.get(item.voter_id);
      if (!uuid) {
        console.warn('No id after upsert for', item.voter_id);
        continue;
      }
      profiles.push({
        voter_id: uuid,
        household_relation_code: item.relation,
      });
    }

    if (profiles.length === 0) continue;

    const { error: pErr } = await supabase
      .from('voter_profiles')
      .upsert(profiles, { onConflict: 'voter_id' });

    if (pErr) {
      console.error('voter_profiles upsert error:', pErr);
      profileErrors++;
    }
  }

  if (profileErrors) {
    console.error(`Completed with ${profileErrors} batch error(s) on voter_profiles`);
    process.exit(1);
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
