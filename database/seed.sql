-- ============================================
-- Employee Onboarding Security Application
-- Database Seeder - 2025 Threat Landscape Content
-- ============================================

-- ============================================
-- TRAINING MODULES - 2025 Cybersecurity Threats
-- ============================================

INSERT INTO training_modules (title, description, content_json, required_time_seconds, module_order) VALUES

-- Module 1: Deepfakes & AI Impersonation
(
    'Deepfakes & AI Impersonation',
    'Learn to identify AI-generated content and protect against executive impersonation attacks in video calls.',
    '{
        "type": "interactive",
        "sections": [
            {
                "id": "intro",
                "title": "The Rise of AI Impersonation",
                "content": "In 2025, deepfake technology has become sophisticated enough to create convincing real-time video impersonations. Attackers use AI to impersonate executives, board members, and trusted colleagues in video calls to authorize fraudulent transactions or extract sensitive information.",
                "duration_seconds": 120
            },
            {
                "id": "case_study",
                "title": "Real-World Case: The $25 Million Deepfake Fraud",
                "content": "In early 2024, a multinational company lost $25 million when an employee received a video call from what appeared to be the company CFO, along with other colleagues. All participants except the victim were AI-generated deepfakes. The attackers used publicly available footage to train their models.",
                "duration_seconds": 180
            },
            {
                "id": "red_flags",
                "title": "Identifying Deepfake Warning Signs",
                "content": "Watch for these indicators: 1) Unusual lighting or skin texture inconsistencies, 2) Slight audio-visual sync issues, 3) Unnatural eye movements or blinking patterns, 4) Requests that bypass normal approval processes, 5) Urgency that discourages verification, 6) Reluctance to answer unexpected questions.",
                "duration_seconds": 150
            },
            {
                "id": "verification_playbook",
                "title": "The Verification Playbook",
                "content": "ALWAYS follow this protocol for sensitive requests: 1) HANG UP the current call, 2) Look up the person''s number in the company directory (never use numbers provided in the call), 3) CALL BACK using the verified number, 4) Establish a verbal passphrase for high-value transactions, 5) When in doubt, involve your manager or security team.",
                "duration_seconds": 200
            },
            {
                "id": "interactive_scenario",
                "title": "Interactive Scenario",
                "content": "You receive a video call from someone who looks and sounds like your CEO. They ask you to urgently transfer $50,000 to a new vendor account. They say the normal approval process is too slow for this critical deal. What should you do?",
                "is_interactive": true,
                "correct_action": "Politely end the call, look up the CEO''s number in the company directory, and call back to verify the request.",
                "duration_seconds": 120
            }
        ],
        "key_takeaways": [
            "Never trust video alone - always verify through independent channels",
            "Use the Verification Playbook for any unusual financial requests",
            "Report suspected deepfakes to the security team immediately"
        ]
    }',
    900,
    1
),

-- Module 2: Quishing (QR Phishing)
(
    'Quishing: QR Code Phishing Attacks',
    'Understand the growing threat of malicious QR codes and learn safe scanning practices.',
    '{
        "type": "interactive",
        "sections": [
            {
                "id": "intro",
                "title": "What is Quishing?",
                "content": "Quishing (QR Phishing) exploits the trust people place in QR codes. Unlike traditional phishing links that you can preview, QR codes hide their destination until scanned. Attackers place malicious codes in emails, physical locations, and even overlay legitimate codes with fake ones.",
                "duration_seconds": 120
            },
            {
                "id": "attack_vectors",
                "title": "Common Quishing Attack Vectors",
                "content": "1) EMAIL QUISHING: Fake invoices or shipping notices with QR codes bypassing email security filters. 2) PHYSICAL QUISHING: Fake codes on parking meters, restaurant menus, or public posters. 3) OVERLAY ATTACKS: Stickers placed over legitimate QR codes. 4) BUSINESS EMAIL COMPROMISE: QR codes in emails appearing to be from colleagues.",
                "duration_seconds": 180
            },
            {
                "id": "parking_meter_case",
                "title": "Case Study: The Parking Meter Scam",
                "content": "Criminals placed fake QR code stickers on parking meters in major US cities. Victims scanned the codes expecting to pay for parking but were directed to phishing sites that stole their payment card information. Over 100 victims lost funds before the scam was discovered.",
                "duration_seconds": 150
            },
            {
                "id": "protection_strategies",
                "title": "Protecting Yourself from Quishing",
                "content": "1) NEVER scan QR codes in unsolicited emails - navigate to websites directly. 2) CHECK physical QR codes for signs of tampering (stickers over stickers). 3) Use a QR scanner that PREVIEWS the URL before opening. 4) Verify shortened URLs expand to legitimate domains. 5) If a payment QR code asks for unusual information, stop immediately.",
                "duration_seconds": 200
            },
            {
                "id": "company_policy",
                "title": "Company QR Code Policy",
                "content": "Our organization policy: 1) We will NEVER send QR codes via email for authentication or payments. 2) All legitimate company QR codes are registered and verifiable. 3) Report suspicious QR codes to security@company.com. 4) When in doubt, manually type the URL instead of scanning.",
                "duration_seconds": 120
            }
        ],
        "key_takeaways": [
            "Treat QR codes with the same suspicion as unknown links",
            "Always preview URLs before visiting them",
            "Physical QR codes can be tampered with - verify the source"
        ]
    }',
    780,
    2
),

-- Module 3: ClickFix & Browser Threats
(
    'ClickFix & Browser-Based Social Engineering',
    'Recognize and defend against attacks that trick users into executing malicious commands.',
    '{
        "type": "interactive",
        "sections": [
            {
                "id": "intro",
                "title": "Understanding ClickFix Attacks",
                "content": "ClickFix is a sophisticated social engineering technique where attackers display fake error messages or security warnings, then instruct victims to ''fix'' the problem by copying and pasting commands into their terminal or Run dialog. These commands download and execute malware.",
                "duration_seconds": 120
            },
            {
                "id": "how_it_works",
                "title": "How ClickFix Attacks Work",
                "content": "1) Victim visits a compromised or malicious website. 2) A convincing error message appears (e.g., ''Your browser needs updating'' or ''Security certificate error''). 3) Instructions tell the user to press Win+R or open Terminal. 4) User is given a command to copy/paste that appears to fix the issue. 5) The command actually downloads and executes malware or creates a backdoor.",
                "duration_seconds": 180
            },
            {
                "id": "real_examples",
                "title": "Real ClickFix Attack Examples",
                "content": "FAKE CAPTCHA: ''Verify you are human'' pages that ask you to run PowerShell commands. FAKE UPDATES: Browser popups claiming you need to run a command to update. FAKE FIXES: ''Your computer has a virus - run this command to clean it''. FAKE IT SUPPORT: Pop-ups directing you to paste commands to ''let IT help you''.",
                "duration_seconds": 150
            },
            {
                "id": "recognition",
                "title": "Recognizing ClickFix Attempts",
                "content": "RED FLAGS: 1) Any website asking you to open Terminal, Command Prompt, or Run dialog. 2) Instructions to copy/paste commands you don''t understand. 3) Pressure or urgency to act quickly. 4) Promises that a command will ''fix'' a problem. 5) Commands containing Base64, PowerShell, curl, wget, or encoded strings.",
                "duration_seconds": 180
            },
            {
                "id": "safe_practices",
                "title": "Safe Practices",
                "content": "NEVER paste commands from websites into your terminal. Legitimate software updates happen through official channels, not copied commands. If you encounter a browser error, close the tab and navigate to the site directly. Contact IT support through official channels if you suspect a real issue.",
                "duration_seconds": 120
            }
        ],
        "key_takeaways": [
            "Legitimate websites NEVER ask you to run terminal commands",
            "Close suspicious browser tabs - don''t interact with them",
            "Contact IT through official channels for real technical issues"
        ]
    }',
    750,
    3
),

-- Module 4: BEC & Pretexting
(
    'Business Email Compromise & Pretexting',
    'Identify sophisticated impersonation attacks targeting financial transactions and sensitive data.',
    '{
        "type": "interactive",
        "sections": [
            {
                "id": "intro",
                "title": "The BEC Threat Landscape",
                "content": "Business Email Compromise (BEC) caused over $2.9 billion in losses in 2023 alone. These attacks combine email spoofing, social engineering, and pretexting to trick employees into transferring funds or revealing sensitive information. Unlike mass phishing, BEC attacks are highly targeted and researched.",
                "duration_seconds": 120
            },
            {
                "id": "pretexting_explained",
                "title": "Understanding Pretexting",
                "content": "Pretexting is the practice of creating a fabricated scenario (pretext) to manipulate victims. Attackers research their targets extensively using LinkedIn, company websites, and social media. They know your colleagues'' names, current projects, and communication styles. This makes their impersonation convincing.",
                "duration_seconds": 150
            },
            {
                "id": "common_scenarios",
                "title": "Common BEC Scenarios",
                "content": "1) CEO FRAUD: Urgent request from ''the CEO'' to wire money. 2) VENDOR IMPERSONATION: Email from a ''vendor'' with new bank details. 3) ATTORNEY IMPERSONATION: ''Lawyer'' requesting confidential documents for litigation. 4) HR IMPERSONATION: Request for employee tax forms or direct deposit changes. 5) ACQUISITION SCAM: Fake M&A deal requiring secret wire transfers.",
                "duration_seconds": 180
            },
            {
                "id": "warning_signs",
                "title": "BEC Warning Signs",
                "content": "BE ALERT FOR: 1) Urgency and secrecy demands. 2) Requests to bypass normal procedures. 3) Slight email address variations (john.smith@company.co vs .com). 4) Changes to payment details or bank accounts. 5) Communication only via email (avoiding phone verification). 6) Unusual timing (requests sent outside business hours).",
                "duration_seconds": 180
            },
            {
                "id": "verification_procedures",
                "title": "Mandatory Verification Procedures",
                "content": "FOR ANY FINANCIAL CHANGES OR TRANSFERS: 1) Call the requester at a KNOWN number (not from the email). 2) Verify with a second authorized person. 3) Check email headers for spoofing indicators. 4) Never rush - legitimate requests can wait for verification. 5) Document all verification steps taken.",
                "duration_seconds": 150
            },
            {
                "id": "scenario",
                "title": "Interactive Scenario",
                "content": "You receive an email from your CFO''s email address asking you to urgently process a wire transfer of $75,000 to a new vendor. The email says ''I''m in a meeting and can''t talk, but this needs to be done in the next hour for a critical deal. Keep this confidential.'' What are the red flags and what should you do?",
                "is_interactive": true,
                "correct_action": "Red flags: urgency, secrecy, avoiding phone verification, bypassing process. Action: Call the CFO at their known number to verify before any action.",
                "duration_seconds": 180
            }
        ],
        "key_takeaways": [
            "Always verify payment changes through a separate, known communication channel",
            "Urgency and secrecy are major red flags",
            "When in doubt, slow down and verify - legitimate requests can wait"
        ]
    }',
    960,
    4
);

-- ============================================
-- QUIZ QUESTIONS - Comprehensive Assessment
-- ============================================

INSERT INTO quiz_questions (module_id, question_text, options_json, correct_answer_index, explanation, difficulty) VALUES

-- Deepfakes & AI Impersonation Questions
(1, 'You receive a video call from your CEO asking you to transfer funds urgently. What is the FIRST thing you should do?',
 '["Complete the transfer since you can see it''s the CEO on video", "Ask the CEO for more details about the transfer", "Hang up and call the CEO back using the number in the company directory", "Email the CEO to confirm the request"]',
 2,
 'The Verification Playbook requires you to hang up and call back using a verified number from the company directory. Video can be faked with deepfakes.',
 'medium'),

(1, 'Which of the following is NOT a common sign of a deepfake video?',
 '["Slight audio-visual sync issues", "Unnatural eye movements", "The person speaking in their native language", "Unusual lighting or skin texture"]',
 2,
 'Speaking in one''s native language is normal. Deepfakes often show sync issues, unnatural movements, and lighting/texture inconsistencies.',
 'easy'),

(1, 'In the 2024 multinational deepfake fraud case, how much money was lost?',
 '["$2.5 million", "$10 million", "$25 million", "$100 million"]',
 2,
 'The company lost $25 million when an employee was deceived by AI-generated deepfakes of the CFO and colleagues.',
 'medium'),

-- Quishing Questions
(2, 'What is Quishing?',
 '["A type of SQL injection attack", "Phishing attacks using QR codes", "A quick phishing test", "An email filtering technique"]',
 1,
 'Quishing (QR Phishing) uses malicious QR codes to direct victims to phishing sites or trigger malware downloads.',
 'easy'),

(2, 'You find a QR code on a parking meter. What should you do before scanning?',
 '["Scan it immediately to avoid a parking ticket", "Check if it looks like a sticker placed over another code", "Ask nearby people if they''ve used it", "Take a photo of it first"]',
 1,
 'Criminals place fake QR codes over legitimate ones. Always check for signs of tampering like stickers over stickers.',
 'medium'),

(2, 'According to company policy, when will our organization send QR codes via email?',
 '["For multi-factor authentication", "For payment processing", "For meeting invitations", "Never - we don''t send QR codes via email"]',
 3,
 'Company policy states we will NEVER send QR codes via email for authentication or payments.',
 'easy'),

-- ClickFix Questions
(3, 'A website shows an error and asks you to open Command Prompt and paste a command to fix it. What should you do?',
 '["Follow the instructions carefully", "Copy the command but run it in Safe Mode", "Close the browser tab immediately and don''t paste anything", "Run the command in a virtual machine"]',
 2,
 'Legitimate websites NEVER ask you to run terminal commands. This is a ClickFix attack designed to execute malware.',
 'easy'),

(3, 'Which of the following is a legitimate reason to paste commands from a website into your terminal?',
 '["To fix a browser certificate error", "To verify you are human (CAPTCHA)", "To update your browser", "None of the above - never paste commands from websites"]',
 3,
 'There is NEVER a legitimate reason to paste commands from websites. All these scenarios are common ClickFix attack pretexts.',
 'medium'),

(3, 'What should you do if you encounter what appears to be a legitimate browser error?',
 '["Follow the on-screen instructions", "Close the tab and navigate to the site directly", "Restart your computer", "Clear your browser cache using the provided command"]',
 1,
 'If you encounter a browser error, close the tab and navigate to the site directly. Never interact with suspicious error messages.',
 'medium'),

-- BEC Questions
(4, 'You receive an email from a vendor requesting updated bank account information for future payments. What should you do?',
 '["Update the information since it''s from a known vendor", "Reply to the email asking for confirmation", "Call the vendor at their known phone number to verify", "Forward the email to your manager"]',
 2,
 'Always verify payment changes through a separate, known communication channel - never by replying to the email.',
 'medium'),

(4, 'Which of the following is the BIGGEST red flag in a BEC attack?',
 '["A request coming from a colleague", "The email being sent during business hours", "Requests for urgency AND secrecy combined", "The email containing a company logo"]',
 2,
 'Urgency combined with secrecy is the biggest red flag. Legitimate urgent requests don''t require bypassing normal verification.',
 'easy'),

(4, 'An email from your CFO asks you to process a wire transfer and says "I''m in a meeting and can''t talk." What type of attack is this likely?',
 '["Ransomware", "CEO Fraud / Business Email Compromise", "Denial of Service", "Man-in-the-middle"]',
 1,
 'This is a classic CEO Fraud BEC attack - impersonating an executive, creating urgency, and avoiding phone verification.',
 'easy'),

-- Cross-module Questions
(NULL, 'What do deepfakes, quishing, ClickFix, and BEC attacks all have in common?',
 '["They all require malware installation", "They all exploit human trust through social engineering", "They all target only financial institutions", "They all originate from the same threat actors"]',
 1,
 'All these attacks exploit human psychology and trust - they are all forms of social engineering.',
 'medium'),

(NULL, 'When facing ANY suspicious request involving money or sensitive data, what is the universal first step?',
 '["Complete the request quickly to avoid delays", "Forward the request to a colleague", "Verify through an independent, known communication channel", "Document and file the request"]',
 2,
 'The universal rule: Always verify through an independent, known communication channel before acting on sensitive requests.',
 'easy'),

(NULL, 'Which verification method is MOST secure when confirming a suspicious request?',
 '["Replying to the original email", "Calling a number provided in the suspicious message", "Calling a number from the company directory or your contacts", "Texting the person"]',
 2,
 'Use a number you already have or from the official company directory - never use contact info provided in the suspicious message.',
 'medium');

-- ============================================
-- SAMPLE USERS (for testing)
-- ============================================

-- Password for emil@strategybrix.com is: Admin123!
-- Hash generated with bcrypt (10 rounds)
INSERT INTO users (name, email, password_hash, role, hire_date) VALUES
('Emil Aliyev', 'emil@strategybrix.com', '$2b$10$rQZ5xzPJvNqJHqHzV.6wOu8KQxQz0QF5kxK8nqZLVvqW8uxQZvxLe', 'admin', '2023-01-01'),
('John Smith', 'john.smith@company.com', '$2b$10$example.hash.for.demo.only', 'employee', '2025-01-15'),
('Sarah Johnson', 'sarah.johnson@company.com', '$2b$10$example.hash.for.demo.only', 'employee', '2025-01-10'),
('Mike Wilson', 'mike.wilson@company.com', '$2b$10$example.hash.for.demo.only', 'manager', '2024-06-01'),
('Admin User', 'admin@company.com', '$2b$10$example.hash.for.demo.only', 'admin', '2023-01-01');

-- ============================================
-- Initialize progress records for new users
-- ============================================
INSERT INTO user_progress (user_id, module_id, is_completed, watched_seconds)
SELECT u.id, tm.id, FALSE, 0
FROM users u
CROSS JOIN training_modules tm
WHERE tm.is_active = TRUE;
