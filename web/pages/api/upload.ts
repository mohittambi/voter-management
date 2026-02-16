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

// Helper: Convert Excel serial date to ISO date
function excelDateToISO(serial: number): string | null {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

// Helper: Parse Marathi full name
function parseMarathiName(fullName: string): { firstName: string; middleName: string; surname: string } {
  if (!fullName) return { firstName: '', middleName: '', surname: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: '', middleName: '', surname: parts[0] };
  if (parts.length === 2) return { firstName: parts[1], middleName: '', surname: parts[0] };
  // Format: Surname FirstName MiddleName
  return { firstName: parts[1] || '', middleName: parts[2] || '', surname: parts[0] || '' };
}

// Helper: Map Marathi relationship to English
function mapRelationship(marathiRelation: string): string {
  const mapping: Record<string, string> = {
    'बायको': 'spouse',
    'नवरा': 'spouse',
    'मुलगा': 'son',
    'मुलगी': 'daughter',
    'आई': 'mother',
    'बाप': 'father',
    'भाऊ': 'sibling',
    'बहीण': 'sibling',
    'स्वतः': 'self',
  };
  return mapping[marathiRelation?.trim()] || 'other';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    // Parse multipart form
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: 'no file uploaded' });

    const filename = file.originalFilename || 'upload.xlsx';
    const filePath = file.filepath;

    // Read and parse Excel
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json(sheet);

    // Upload file to Supabase Storage
    const storagePath = `${Date.now()}-${filename}`;
    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      });
    if (uploadErr) throw uploadErr;

    // Create import record
    const { data: importData, error: impErr } = await supabase
      .from('imports')
      .insert([{ 
        filename, 
        uploaded_by: null, 
        record_count: records.length, 
        storage_path: storagePath 
      }])
      .select()
      .single();
    if (impErr) throw impErr;

    let importedCount = 0;
    let familiesCreated = 0;
    const familyMap = new Map<string, string>(); // Map family head name to family_id

    // Process records in batches
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      
      for (const record of batch) {
        try {
          // Skip if no voter_id
          if (!record.voter_id) continue;

          // Parse names
          const marathiName = record['मतदाराचे नाव'] || '';
          const parsedName = parseMarathiName(marathiName);
          
          // Get or create worker
          let workerId = null;
          const workerName = record['कार्यकर्ता'];
          const workerMobile = record['मोबाइल नं']?.toString();
          const workerEpic = record[' कार्यकर्ता Epic No.'];
          
          if (workerName) {
            const { data: existingWorker } = await supabase
              .from('workers')
              .select('id')
              .eq('name', workerName)
              .maybeSingle();
            
            if (existingWorker) {
              workerId = existingWorker.id;
            } else {
              const { data: newWorker } = await supabase
                .from('workers')
                .insert({ name: workerName, mobile: workerMobile, epic_number: workerEpic })
                .select('id')
                .single();
              if (newWorker) workerId = newWorker.id;
            }
          }

          // Get or create employee
          let employeeId = null;
          const employeeName = record['कर्मचारी नाव'];
          const employeeIdNum = record['कर्मचारी आय डी'];
          
          if (employeeName && employeeIdNum) {
            const { data: existingEmp } = await supabase
              .from('employees')
              .select('id')
              .eq('employee_id', employeeIdNum)
              .maybeSingle();
            
            if (existingEmp) {
              employeeId = existingEmp.id;
            } else {
              const { data: newEmp } = await supabase
                .from('employees')
                .insert({ name: employeeName, employee_id: employeeIdNum })
                .select('id')
                .single();
              if (newEmp) employeeId = newEmp.id;
            }
          }

          // Get or create village
          let villageId = null;
          const villageName = record['गाव'];
          const newGan = record['नवीन गण'];
          const newGat = record['नवीन गट'];
          
          if (villageName) {
            const { data: existingVillage } = await supabase
              .from('villages')
              .select('id')
              .eq('name', villageName)
              .maybeSingle();
            
            if (existingVillage) {
              villageId = existingVillage.id;
            } else {
              const { data: newVillage } = await supabase
                .from('villages')
                .insert({ name: villageName, new_gan: newGan, new_gat: newGat })
                .select('id')
                .single();
              if (newVillage) villageId = newVillage.id;
            }
          }

          // Insert or update master_voters
          const voterData = {
            first_name: parsedName.firstName || record.name_english?.split(' ')[0] || null,
            middle_name: parsedName.middleName || null,
            surname: parsedName.surname || record.surname || null,
            voter_id: record.voter_id,
            raw_import_id: importData.id,
            booth_number: record['बुथ नं'] || null,
            serial_number: record['अनुक्रमांक'] || null,
            name_marathi: marathiName || null,
            name_english: record.name_english || null,
            surname_marathi: parsedName.surname || null,
            caste: record['जात'] || null,
            age: record.age || null,
            gender: record.gender || null,
            assembly_constituency: record.zAC_AC2024?.toString() || null,
          };

          const { data: insertedVoter, error: voterErr } = await supabase
            .from('master_voters')
            .upsert(voterData, { onConflict: 'voter_id' })
            .select('id')
            .single();

          if (voterErr || !insertedVoter) {
            console.error('voter insert error:', voterErr);
            continue;
          }

          const voterId = insertedVoter.id;

          // Insert voter_profile
          const profileData = {
            voter_id: voterId,
            dob: excelDateToISO(record['जन्मतारीख']),
            mobile: record['मोबाईल नंबर']?.toString() || null,
            mobile_secondary: null,
            address_marathi: record.address_marathi || null,
            address_english: null,
            village: villageName || null,
            status: record['मयत/दुबार/बेपत्ता'] || 'Active',
            worker_id: workerId,
            employee_id: employeeId,
            village_id: villageId,
          };

          await supabase
            .from('voter_profiles')
            .upsert(profileData, { onConflict: 'voter_id', ignoreDuplicates: false });

          importedCount++;

          // Handle family linking
          const familyHeadName = record['कुटुंबप्रमुख'];
          const isHead = record.kutumb_pramukh === 1;
          const relationship = record['नाते'];

          if (familyHeadName) {
            if (isHead) {
              // This voter is a family head
              if (!familyMap.has(familyHeadName)) {
                // Create new family
                const { data: newFamily } = await supabase
                  .from('families')
                  .insert({ head_voter_id: voterId })
                  .select('id')
                  .single();
                
                if (newFamily) {
                  familyMap.set(familyHeadName, newFamily.id);
                  familiesCreated++;
                }
              }
            } else {
              // This voter is a family member
              // Find family head by name
              const { data: headVoter } = await supabase
                .from('master_voters')
                .select('id')
                .eq('name_marathi', familyHeadName)
                .maybeSingle();

              if (headVoter) {
                // Check if family exists for this head
                const { data: existingFamily } = await supabase
                  .from('families')
                  .select('id')
                  .eq('head_voter_id', headVoter.id)
                  .maybeSingle();

                let familyId = existingFamily?.id;

                if (!familyId) {
                  // Create family for this head
                  const { data: newFamily } = await supabase
                    .from('families')
                    .insert({ head_voter_id: headVoter.id })
                    .select('id')
                    .single();
                  
                  if (newFamily) {
                    familyId = newFamily.id;
                    familyMap.set(familyHeadName, familyId);
                    familiesCreated++;
                  }
                }

                // Link this voter as family member
                if (familyId) {
                  await supabase
                    .from('family_members')
                    .insert({
                      family_id: familyId,
                      voter_id: voterId,
                      relationship: mapRelationship(relationship),
                      relationship_marathi: relationship,
                    })
                    .select();
                }
              }
            }
          }

        } catch (err) {
          console.error('Error processing record:', err);
        }
      }
    }

    return res.status(200).json({ 
      imported: importedCount, 
      families_created: familiesCreated,
      import_id: importData.id 
    });
    
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'server error' });
  }
}
