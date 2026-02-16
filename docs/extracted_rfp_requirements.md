# Extracted Requirements — Voter-Linked Public Service Management Software

Source RFP: `/Users/mohittambi/Library/Application Support/Cursor/User/workspaceStorage/0929d1bed2cfb315dd1eafd7a4df7b77/pdfs/64d09627-df24-4acc-b3b1-f8d4b9e9a70d/RFP Office Software.pdf`

## Summary

- Centralised web-based system to manage citizen service requests using a pre-loaded voter master list.

- Key capabilities: voter master database, fast search and identification, service request lifecycle, automated communications (WhatsApp/SMS/AI voice), family mapping, no-code dynamic form builder, reporting & analytics, RBAC and audit logs.

## Functional Requirements (by priority)

1. Voter List Integration (Core) [SECTION 3.1]
   - Upload Excel file to populate voter master database. (Fields: First Name, Middle Name, Surname, Voter ID) — Master list is non-editable and searchable. (Priority: High)
2. Applicant Search & Identification [SECTION 3.2]
   - Search by First/Middle/Surname, Mobile Number, Aadhaar Number. On match, open applicant voter profile. Staff may update DOB, Mobile, Aadhaar, Email, Social IDs. (Priority: High)
3. Service Request & Allocation [SECTION 3.3]
   - Create service requests against voter profiles. Service selection via dropdown. Admin can add/edit/manage service types. (Priority: High)
4. Work Status Management [SECTION 3.4]
   - Status workflow with defined statuses (Document Submitted, Document Shared to Office, Work in Progress, Work Completed, Closed/Delivered). Maintain status history with date/time stamps. (Priority: High)
5. Automated Communication System [SECTION 3.5]
   - On every status change, trigger WhatsApp message, SMS, and AI voice call automatically using template-based messages that include Applicant Name, Service Type, Current Status. (Priority: High)
6. Family Tagging & Family Head Mapping [SECTION 5]
   - Link voters into families using Family Head; rules: one family head can have multiple members; a voter belongs to only one family; linking only from voter master list (no manual entry). Provide family tree/list view; optional relationship dropdown. (Priority: Medium)
7. Automated Birthday & Anniversary Communications [SECTION 6]
   - Store DOB and Marriage Anniversary; automatically send WhatsApp/SMS/AI call on these dates. (Priority: Medium)
8. Dynamic Form Builder (No-code) [SECTION 7]
   - Admin can create unlimited service-specific forms, add/remove/reorder fields, and make them available immediately without deployment. (Priority: Medium)
9. Reporting & Data Analytics (Admin) [SECTION 8]
   - Provide dashboards and exports for voter/master data, family reports, applicant profiles, service/form reports, work status metrics, birthday/anniversary schedules, communication logs, user activity & audit logs, performance summaries. (Priority: High)
10. User Roles & Access [SECTION 4]

- Roles: Admin (full access, upload voter list, manage services, configure templates), Office User (search voters, create requests, update statuses). Implement secure login and RBAC. (Priority: High)

## Data Requirements

- Master voter dataset (non-editable): searchable, uploaded via Excel. Minimum fields: First Name, Middle Name, Surname, Voter ID. (SECTION 3.1)

- Extendable profile fields editable by staff: DOB, Mobile, Aadhaar, Email, Social IDs. (SECTION 3.2, 6.1)

- Store timestamps for status changes, form submissions, and audit logs. (SECTION 3.4, 8.8)

## Integration Requirements

- APIs or gateway integrations for:

  - WhatsApp (template messaging) (SECTION 9)

  - SMS provider (SECTION 9)

  - AI Voice Calls provider (SECTION 9)

- Excel import support for initial and incremental uploads. (SECTION 3.1)

## Security & Compliance

- Secure login, RBAC, and audit logging for data entry, status updates, and form changes. (SECTION 4, 8.8)

- Masking of sensitive fields for reports (e.g., partial masking of Mobile & Aadhaar). (SECTION 8.3)

## Non-functional Requirements

- Web-based, responsive for desktop & mobile. (SECTION 9)

- Cloud hosting. (SECTION 9)

- Real-time reporting and accurate filters/exports required for acceptance. (SECTION 10)

## Acceptance Criteria (summary)

- Real-time dashboards and reports visible to Admin users. (SECTION 10)

- Accurate filters and export to Excel/PDF for listed reports. (SECTION 10)

- Communication triggers reliably fire on status changes and scheduled events (birthdays/anniversaries). (SECTION 3.5, 6)

- Voter master remains non-editable and is the source of truth for linking families. (SECTION 3.1, 5)

## Deliverables expected from vendor

- Working web application deployed to cloud environment.

- API/integration documentation for WhatsApp/SMS/AI voice.

- Admin manual for dynamic form builder and service management.

- Test plan showing verification of acceptance criteria and sample data.

## Testable Acceptance Criteria (detailed)

Each criterion below is phrased as a pass/fail test the vendor can demonstrate.

- AC-01: Voter Upload

  - Given a valid Excel file with required fields, when Admin uploads, then the system accepts the file and displays count of imported records; records are searchable and non-editable. (Source: SECTION 3.1)

- AC-02: Search & Profile Update

  - Given existing voter data, when Office User searches by name or Aadhaar or mobile, then matching profile opens within 2 seconds; Office User can update DOB/Mobile/Aadhaar/Email and changes are reflected in profile history. (Source: SECTION 3.2)

- AC-03: Create Service Request

  - Given an open voter profile, when Office User creates a service request selecting a service type, then the request is created, assigned a unique ID, and appears in work queues. (Source: SECTION 3.3)

- AC-04: Status Workflow & History

  - When status changes occur, the system records the new status with timestamp and user ID; the status history for the request shows full chronological entries. (Source: SECTION 3.4)

- AC-05: Automated Communications on Status Change

  - When a status change happens, the system sends a templated WhatsApp message, SMS, and triggers AI voice call to the registered mobile number automatically; communication logs record delivery status and failure reason if any. (Source: SECTION 3.5)

- AC-06: Family Linking Constraints

  - Family linking is only possible by selecting records from master list; after linking, family view shows head and members; one voter cannot belong to multiple families. (Source: SECTION 5)

- AC-07: Birthday & Anniversary Automation

  - System queues and sends messages on the correct dates; admin reports show messages sent/pending and delivery status for the period. (Source: SECTION 6)

- AC-08: Dynamic Form Availability

  - When Admin creates or updates a form, the form is immediately available for data entry without deployment; previously collected data remains accessible. (Source: SECTION 7)

- AC-09: Reporting & Exports

  - Admin can generate filters and export reports (Excel/PDF) for voter counts, family reports, service counts, status breakdowns, and communication logs; exported files match on-screen data. (Source: SECTION 8)

- AC-10: Security & Audit

  - Role-based access prevents unauthorized actions; audit logs capture data entry, status updates, form changes, and timestamps for review. (Source: SECTION 4, 8.8)

## Vendor Clarifying Questions (short list)

1. Expected message throughput and SLA for WhatsApp/SMS/voice deliveries? Any peak-day estimates? (Needed for choice of provider and rate limits)

2. Is Aadhaar data storage subject to any specific compliance or retention policy we should follow? (Privacy/legal requirement)

3. How should Excel updates be handled after initial upload: full replacements, incremental patching, or append-only updates? (Master data update policy)

4. Any expected SSO/identity provider (e.g., Azure AD, Google Workspace) for secure login or will vendor propose? (Integration detail)

5. Are there preferred cloud providers or procurement constraints (e.g., AWS/GCP/Azure/local data residency)? (Hosting constraints)

6. Do scheduled automated communications (birthday/anniversary) require opt-out management or consent tracking? (Legal/UX)

## Completed

- Acceptance criteria draft and vendor questions created.

## Notes / Observations

- RFP mandates that master voter list is non-editable but staff can augment certain profile fields — clarify how incremental updates are handled (append-only vs replace).

- No explicit SLA or expected message throughput provided.

- No details on data retention, backup, and privacy/compliance (e.g., handling Aadhaar data) — requires clarification.

## Next steps performed

- Requirements extraction completed (this file).
