-- ============================================
-- Seed Data: Onboarding Checklists Templates
-- Date: 2026-01-21
-- Description: Populates all 4 checklist templates with sections and items
-- ============================================

BEGIN;

-- ============================================
-- 1. FULL-TIME EMPLOYEE ONBOARDING (ft-onboarding)
-- ============================================

-- Section 1: Pre-Onboarding (Before Day 1)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Pre-Onboarding (Before Day 1)', 'Tasks to complete before the employee starts', 1
FROM checklist_templates WHERE template_id = 'ft-onboarding'
ON CONFLICT DO NOTHING;

-- Section 1 Items - Subsection A: Hiring & Legal
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Role, level, compensation, reporting manager finalized', NULL, 'Hiring & Legal', 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Offer letter issued through Rippling and countersigned', NULL, 'Hiring & Legal', 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'NDA, Confidentiality, Non-Solicit agreements executed', NULL, 'Hiring & Legal', 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Right-to-work verification completed', NULL, 'Hiring & Legal', 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 1 Items - Subsection B: Background & Risk Checks
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Background check completed and cleared', NULL, 'Background & Risk Checks', 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 1 Items - Subsection C: Payroll, Benefits & Records
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Rippling profile created', NULL, 'Payroll, Benefits & Records', 6, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Personal, tax, and banking details collected', NULL, 'Payroll, Benefits & Records', 7, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Compensation & start date confirmed in payroll system', NULL, 'Payroll, Benefits & Records', 8, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 1 Items - Subsection D: IT & Access Provisioning
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Company email created', NULL, 'IT & Access Provisioning', 9, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Slack account created (access enabled Day 1)', NULL, 'IT & Access Provisioning', 10, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Google Drive access planned', NULL, 'IT & Access Provisioning', 11, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Company device ordered and shipped', NULL, 'IT & Access Provisioning', 12, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 2: Day 1 Checklist
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Day 1 Checklist', 'First day essential tasks', 2
FROM checklist_templates WHERE template_id = 'ft-onboarding'
ON CONFLICT DO NOTHING;

-- Section 2 Items - Subsection A: Access & Security
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Login to company email, Slack, Google Workspace', NULL, 'Access & Security', 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'MFA / 2FA enabled on all systems', NULL, 'Access & Security', 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Device security verified (strong password + lock)', NULL, 'Access & Security', 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'MDM enrollment completed', NULL, 'Access & Security', 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Section 2 Items - Subsection B: Orientation
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review SBX onboarding deck', NULL, 'Orientation', 5, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review company values & operating principles', NULL, 'Orientation', 6, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review confidentiality & data handling expectations', NULL, 'Orientation', 7, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Create a Slack profile picture', NULL, 'Orientation', 8, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Section 2 Items - Subsection C: Introductions
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Intro call with Hiring Manager', NULL, 'Introductions', 9, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Intro call with Buddy', NULL, 'Introductions', 10, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Intro call with Ops Admin', NULL, 'Introductions', 11, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Added to required Slack channels', NULL, 'Introductions', 12, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Received Handbook and read it', 'Employee handbook with company policies and procedures', 'Orientation', 13, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Section 3: Week 1 Checklist
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Week 1 Checklist', 'First week tasks', 3
FROM checklist_templates WHERE template_id = 'ft-onboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Complete intro 1:1s with team', NULL, NULL, 1, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Complete intros with leadership team', NULL, NULL, 2, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review in-flight projects', NULL, NULL, 3, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Set up timesheet access', NULL, NULL, 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Submit first timesheet', NULL, NULL, 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Create internal bio', NULL, NULL, 6, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

-- Section 4: Month 1 Checklist
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Month 1 Checklist', 'First month milestones', 4
FROM checklist_templates WHERE template_id = 'ft-onboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Begin contributing to internal/client work', NULL, NULL, 1, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Monthly check-in with manager', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Define expectations & growth goals', NULL, NULL, 3, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

-- Section 5: Cybersecurity (Mandatory)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Cybersecurity (Mandatory)', 'Required security training', 5
FROM checklist_templates WHERE template_id = 'ft-onboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory, auto_complete_trigger)
SELECT cs.id, 'Security awareness training completed', 'Auto-completes when quiz is passed', NULL, 1, TRUE, 'quiz_passed'
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 5
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory, auto_complete_trigger)
SELECT cs.id, 'Phishing awareness training completed', 'Auto-completes when training modules are done', NULL, 2, TRUE, 'training_completed'
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'ft-onboarding' AND cs.section_order = 5
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CONTRACTOR ONBOARDING (contractor-onboarding)
-- ============================================

-- Section 1: Pre-Onboarding (Before Start Date)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Pre-Onboarding (Before Start Date)', 'Tasks before contractor engagement begins', 1
FROM checklist_templates WHERE template_id = 'contractor-onboarding'
ON CONFLICT DO NOTHING;

-- Subsection A: Contracting & Legal
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Contractor agreement executed via DocuSign', NULL, 'Contracting & Legal', 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Engagement scope, rate, and billing cadence confirmed', NULL, 'Contracting & Legal', 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Subsection B: Risk & Due Diligence
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Background check completed', NULL, 'Risk & Due Diligence', 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Subsection C: Payments & Records
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Payment method confirmed (Wise)', NULL, 'Payments & Records', 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Tax forms collected (W-8 / W-9 or local equivalent)', NULL, 'Payments & Records', 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Invoicing instructions shared', NULL, 'Payments & Records', 6, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Subsection D: IT Access Planning
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Company email created', NULL, 'IT Access Planning', 7, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Slack access defined (channels limited to engagement)', NULL, 'IT Access Planning', 8, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Google Drive access defined (client-specific folders only)', NULL, 'IT Access Planning', 9, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Laptop shipped (if SBX provided) and MDM completed', NULL, 'IT Access Planning', 10, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 2: Day 1 Checklist
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Day 1 Checklist', 'First day essential tasks for contractors', 2
FROM checklist_templates WHERE template_id = 'contractor-onboarding'
ON CONFLICT DO NOTHING;

-- Subsection A: Security First
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'MFA / 2FA enabled on all SBX systems', NULL, 'Security First', 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Acknowledged phishing & security guidelines', NULL, 'Security First', 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Subsection B: Access & Orientation
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Access Slack and required channels', NULL, 'Access & Orientation', 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Access approved Drive folders', NULL, 'Access & Orientation', 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review SBX Portal SOP, Timesheet process and Invoicing Portal', NULL, 'Access & Orientation', 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Subsection C: Engagement Setup
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Intro call with Hiring Manager', NULL, 'Engagement Setup', 6, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Review scope, deliverables, and timelines', NULL, 'Engagement Setup', 7, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Confirm communication & escalation paths', NULL, 'Engagement Setup', 8, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Section 3: First 30 Days
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'First 30 Days', 'First month milestones for contractors', 3
FROM checklist_templates WHERE template_id = 'contractor-onboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Begin delivery on assigned work', NULL, NULL, 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Submit invoices per agreed cadence', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

-- Section 4: Security Rules (Acknowledgment)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Security Rules (Acknowledgment)', 'Security acknowledgments required from contractors', 4
FROM checklist_templates WHERE template_id = 'contractor-onboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'No SBX or client data on personal email/storage', 'Acknowledged', NULL, 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'No reuse of access across engagements', 'Acknowledged', NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Access automatically expires at contract end', 'Acknowledged', NULL, 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'contractor-onboarding' AND cs.section_order = 4
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. PERIODIC COMPLIANCE (periodic-compliance)
-- ============================================

-- Section 1: Quarterly
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Quarterly', 'Tasks to complete every quarter', 1
FROM checklist_templates WHERE template_id = 'periodic-compliance'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Manager check-in', NULL, NULL, 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Timesheet and billing compliance review', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Fill in the Bios', NULL, NULL, 3, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 2: Semi-Annual
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Semi-Annual', 'Tasks to complete every 6 months', 2
FROM checklist_templates WHERE template_id = 'periodic-compliance'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory, auto_complete_trigger)
SELECT cs.id, 'Cybersecurity refresher training', NULL, NULL, 1, TRUE, 'training_completed'
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Phishing simulation or refresher', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Device security re-attestation', NULL, NULL, 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

-- Section 3: Annual (Mandatory)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Annual (Mandatory)', 'Mandatory annual compliance tasks', 3
FROM checklist_templates WHERE template_id = 'periodic-compliance'
ON CONFLICT DO NOTHING;

-- Subsection A: Security & Compliance
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory, auto_complete_trigger)
SELECT cs.id, 'Full cybersecurity training completed', NULL, 'Security & Compliance', 1, TRUE, 'quiz_passed'
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Data protection & acceptable use policy re-acknowledged', NULL, 'Security & Compliance', 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'MFA / password hygiene review', NULL, 'Security & Compliance', 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

-- Subsection B: Risk & Governance
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Background check refresh (risk-based)', NULL, 'Risk & Governance', 4, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

-- Subsection C: Performance & Growth
INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Quarterly performance reviews completed', NULL, 'Performance & Growth', 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Role clarity & responsibility confirmation', NULL, 'Performance & Growth', 6, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Career development planning', NULL, 'Performance & Growth', 7, FALSE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'periodic-compliance' AND cs.section_order = 3
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. ADMIN PRE-ONBOARDING (admin-preonboarding)
-- ============================================

-- Section 1: Before Day 1 (HR Admin tasks)
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'Before Day 1 (HR Admin tasks)', 'Tasks for HR admin to complete before new hire starts', 1
FROM checklist_templates WHERE template_id = 'admin-preonboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Send onboarding welcome email', NULL, NULL, 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Assign buddy', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Assign hiring manager', NULL, NULL, 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Send intro email to team (announcing new joiner)', NULL, NULL, 4, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Create first week calendar blocks (intro calls, trainings)', NULL, NULL, 5, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Add employee to required Slack channels', NULL, NULL, 6, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Setup timesheet access', NULL, NULL, 7, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 1
ON CONFLICT DO NOTHING;

-- Section 2: For Contractors
INSERT INTO checklist_sections (template_id, title, description, section_order)
SELECT id, 'For Contractors', 'Additional tasks for contractor onboarding', 2
FROM checklist_templates WHERE template_id = 'admin-preonboarding'
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Share tax form (W8/W9)', NULL, NULL, 1, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Share invoicing instructions', NULL, NULL, 2, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_items (section_id, title, description, subsection, item_order, is_mandatory)
SELECT cs.id, 'Open Wise account', NULL, NULL, 3, TRUE
FROM checklist_sections cs
JOIN checklist_templates ct ON cs.template_id = ct.id
WHERE ct.template_id = 'admin-preonboarding' AND cs.section_order = 2
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT ct.name, cs.title, COUNT(cti.id) as items
-- FROM checklist_templates ct
-- JOIN checklist_sections cs ON ct.id = cs.template_id
-- LEFT JOIN checklist_template_items cti ON cs.id = cti.section_id
-- GROUP BY ct.name, cs.title, cs.section_order
-- ORDER BY ct.name, cs.section_order;
