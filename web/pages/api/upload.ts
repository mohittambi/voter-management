import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import * as XLSX from 'xlsx';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'imports';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

function excelDateToISO(serial: number): string | null {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const date_info = new Date(utc_days * 86400 * 1000);
  return date_info.toISOString().split('T')[0];
}

function parseMarathiName(fullName: string): { firstName: string; middleName: string; surname: string } {
  if (!fullName) return { firstName: '', middleName: '', surname: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: '', middleName: '', surname: parts[0] };
  if (parts.length === 2) return { firstName: parts[1], middleName: '', surname: parts[0] };
  return { firstName: parts[1] || '', middleName: parts[2] || '', surname: parts[0] || '' };
}

function mapRelationship(marathiRelation: string): string {
  const mapping: Record<string, string> = {
    'बायको': 'spouse', 'नवरा': 'spouse', 'मुलगा': 'son', 'मुलगी': 'daughter',
    'आई': 'mother', 'बाप': 'father', 'भाऊ': 'sibling', 'बहीण': 'sibling', 'स्वतः': 'self',
  };
  return mapping[marathiRelation?.trim()] || 'other';
}

async function batchInsert<T extends object>(table: string, rows: T[], onConflict: string, chunkSize = 500): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk as any, { onConflict, ignoreDuplicates: true });
    if (error) console.error(`batchInsert ${table} error:`, error.message);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const form = formidable({});
    const [, files] = await form.parse(req);
    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: 'no file uploaded' });

    const filename = file.originalFilename || 'upload.xlsx';
    const buffer = fs.readFileSync(file.filepath);
    const workbook = XLSX.read(buffer);
    const records = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[workbook.SheetNames[0]]);

    // Upload file to storage (non-blocking, best-effort)
    const storagePath = `${Date.now()}-${filename}`;
    supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    });

    // Create import record
    const { data: importData, error: impErr } = await supabase
      .from('imports')
      .insert([{ filename, uploaded_by: null, record_count: records.length, storage_path: storagePath }])
      .select().single();
    if (impErr) throw impErr;

    // ── STEP 1: collect unique workers, employees, villages ──────────────────
    const workerMap = new Map<string, { name: string; mobile?: string; epic_number?: string }>();
    const employeeMap = new Map<string, { name: string; employee_id: string }>();
    const villageMap = new Map<string, { name: string; new_gan?: string; new_gat?: string }>();

    for (const r of records) {
      const workerName = r['कार्यकर्ता'];
      if (workerName && !workerMap.has(workerName)) {
        workerMap.set(workerName, {
          name: workerName,
          mobile: r['मोबाइल नं']?.toString(),
          epic_number: r[' कार्यकर्ता Epic No.'],
        });
      }
      const empName = r['कर्मचारी नाव'];
      const empId = r['कर्मचारी आय डी'];
      if (empName && empId && !employeeMap.has(empId)) {
        employeeMap.set(empId, { name: empName, employee_id: empId });
      }
      const village = r['गाव'];
      if (village && !villageMap.has(village)) {
        villageMap.set(village, { name: village, new_gan: r['नवीन गण'], new_gat: r['नवीन गट'] });
      }
    }

    // ── STEP 2: batch upsert workers, employees, villages ────────────────────
    await batchInsert('workers', Array.from(workerMap.values()), 'name,mobile');
    await batchInsert('employees', Array.from(employeeMap.values()), 'employee_id');
    await batchInsert('villages', Array.from(villageMap.values()), 'name');

    // ── STEP 3: fetch back their IDs ─────────────────────────────────────────
    const workerNameToId = new Map<string, string>();
    const employeeCodeToId = new Map<string, string>();
    const villageNameToId = new Map<string, string>();

    if (workerMap.size > 0) {
      const { data: ws } = await supabase.from('workers').select('id, name').in('name', Array.from(workerMap.keys()));
      ws?.forEach(w => workerNameToId.set(w.name, w.id));
    }
    if (employeeMap.size > 0) {
      const { data: es } = await supabase.from('employees').select('id, employee_id').in('employee_id', Array.from(employeeMap.keys()));
      es?.forEach(e => employeeCodeToId.set(e.employee_id, e.id));
    }
    if (villageMap.size > 0) {
      const { data: vs } = await supabase.from('villages').select('id, name').in('name', Array.from(villageMap.keys()));
      vs?.forEach(v => villageNameToId.set(v.name, v.id));
    }

    // ── STEP 4: batch upsert master_voters ───────────────────────────────────
    const validRecords = records.filter(r => r.voter_id);
    const voterRows = validRecords.map(r => {
      const parsed = parseMarathiName(r['मतदाराचे नाव'] || '');
      return {
        voter_id: r.voter_id,
        first_name: parsed.firstName || r.name_english?.split(' ')[0] || null,
        middle_name: parsed.middleName || null,
        surname: parsed.surname || r.surname || null,
        raw_import_id: importData.id,
        booth_number: r['बुथ नं'] || null,
        serial_number: r['अनुक्रमांक'] || null,
        name_marathi: r['मतदाराचे नाव'] || null,
        name_english: r.name_english || null,
        surname_marathi: parsed.surname || null,
        caste: r['जात'] || null,
        age: r.age || null,
        gender: r.gender || null,
        assembly_constituency: r.zAC_AC2024?.toString() || null,
      };
    });

    for (let i = 0; i < voterRows.length; i += 500) {
      const chunk = voterRows.slice(i, i + 500);
      await supabase.from('master_voters').upsert(chunk, { onConflict: 'voter_id' });
    }

    // ── STEP 5: fetch voter UUIDs ─────────────────────────────────────────────
    const voterIdToUUID = new Map<string, string>();
    for (let i = 0; i < validRecords.length; i += 500) {
      const chunk = validRecords.slice(i, i + 500).map(r => r.voter_id);
      const { data: vs } = await supabase.from('master_voters').select('id, voter_id').in('voter_id', chunk);
      vs?.forEach(v => voterIdToUUID.set(v.voter_id, v.id));
    }

    // ── STEP 6: batch upsert voter_profiles ──────────────────────────────────
    const profileRows = validRecords
      .map(r => {
        const uuid = voterIdToUUID.get(r.voter_id);
        if (!uuid) return null;
        return {
          voter_id: uuid,
          dob: excelDateToISO(r['जन्मतारीख']),
          mobile: r['मोबाईल नंबर']?.toString() || null,
          mobile_secondary: null,
          address_marathi: r.address_marathi || null,
          village: r['गाव'] || null,
          status: r['मयत/दुबार/बेपत्ता'] || 'Active',
          worker_id: workerNameToId.get(r['कार्यकर्ता']) || null,
          employee_id: employeeCodeToId.get(r['कर्मचारी आय डी']) || null,
          village_id: villageNameToId.get(r['गाव']) || null,
        };
      })
      .filter(Boolean) as object[];

    for (let i = 0; i < profileRows.length; i += 500) {
      const chunk = profileRows.slice(i, i + 500);
      await supabase.from('voter_profiles').upsert(chunk, { onConflict: 'voter_id', ignoreDuplicates: false });
    }

    // ── STEP 7: families (lightweight, only for heads) ────────────────────────
    const headRecords = validRecords.filter(r => r.kutumb_pramukh === 1 && r['कुटुंबप्रमुख']);
    let familiesCreated = 0;
    for (const r of headRecords) {
      const uuid = voterIdToUUID.get(r.voter_id);
      if (!uuid) continue;
      const { data: existing } = await supabase.from('families').select('id').eq('head_voter_id', uuid).maybeSingle();
      if (!existing) {
        await supabase.from('families').insert({ head_voter_id: uuid });
        familiesCreated++;
      }
    }

    return res.status(200).json({
      imported: validRecords.length,
      families_created: familiesCreated,
      import_id: importData.id,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
