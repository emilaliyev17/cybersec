-- Replace old 200 questions with new 30 presentation-based questions
-- Run this against the GCP PostgreSQL database

-- Step 1: Clear existing questions
DELETE FROM quiz_questions;

-- Step 2: Insert 30 new questions covering AI Best Practices & Phishing Awareness
INSERT INTO quiz_questions (question_text, options_json, correct_answer_index, explanation, difficulty, category, is_active) VALUES

-- Question 1
('Which of the following represents the core principle of "Validity & Reliability" at StrategyBRIX?',
'["A) Documenting all AI tool usage for clients", "B) Protecting sensitive data through proper protocols", "C) Verifying all AI outputs with human expertise and authoritative sources", "D) Actively identifying potential biases in recommendations"]',
2, 'According to the source, Validity & Reliability requires verifying all AI outputs with human expertise and authoritative sources.', 'medium', 'AI Security', true),

-- Question 2
('According to the "Golden Rules" for client deliverables, what is an action you must ALWAYS take?',
'["A) Rely on AI confidence levels as a proxy for accuracy", "B) Submit AI content immediately to meet deadlines", "C) Use generic AI responses to ensure consistency", "D) Verify all facts, statistics, and citations before delivery"]',
3, 'The Golden Rules explicitly state you must always verify all facts, statistics, and citations before delivery.', 'medium', 'AI Security', true),

-- Question 3
('What is explicitly listed as something you must NEVER do regarding client deliverables?',
'["A) Customize AI content to reflect specific contexts", "B) Rely on AI-generated citations without confirming the sources exist", "C) Have a subject matter expert review the work", "D) Use enterprise AI tools for drafting content"]',
1, 'You must never rely on AI-generated citations without confirming the sources actually exist.', 'medium', 'AI Security', true),

-- Question 4
('When handling data, what is the first step you must take before inputting information into any AI system?',
'["A) Encrypt the file with a password", "B) Redact all personally identifiable information (PII)", "C) Ask the AI tool if it is secure", "D) Upload the data to a public tool to test compatibility"]',
1, 'The ''Anonymize First'' policy requires redacting all PII before inputting data into any AI system.', 'easy', 'AI Security', true),

-- Question 5
('What type of data should be used to test AI tools safely?',
'["A) Real client data that is over 5 years old", "B) Live customer databases with emails removed", "C) Synthetic or sample datasets that mirror real data structures", "D) Publicly available data about the client''s competitors"]',
2, 'Employees should test AI tools with synthetic or sample datasets that mirror real data structures rather than real client data.', 'medium', 'AI Security', true),

-- Question 6
('Which policy applies to the use of public or free AI tools?',
'["A) They can be used for client data if the project is low-stakes", "B) They are permitted for use with internal StrategyBRIX data only", "C) You must never input confidential data into public or free AI tools", "D) They are allowed if you use a VPN"]',
2, 'The guidelines state: Critical: Never input confidential data into public or free AI tools.', 'easy', 'AI Security', true),

-- Question 7
('What is a common AI pitfall known as "hallucination"?',
'["A) The AI slowing down due to high traffic", "B) The AI refusing to answer a prompt due to safety filters", "C) Fabricated statistics and citations that appear authoritative but are fake", "D) The AI copying text directly from a copyrighted source"]',
2, 'Hallucinations are described as fabricated statistics and citations that appear authoritative but are incorrect.', 'easy', 'AI Security', true),

-- Question 8
('In the real-world scenario regarding a customer database, what is the "Right Approach" for handling customer names?',
'["A) Keep the names but remove the email addresses", "B) Replace names with codes like \"Customer_001\"", "C) Use initials only (e.g., John Smith becomes J.S.)", "D) Encrypt the names using a third-party tool"]',
1, 'The ''Right Approach'' involves replacing names with anonymized codes like Customer_001.', 'medium', 'AI Security', true),

-- Question 9
('According to the "Quick Decision Framework," what action is required if a task involves a "High-Stakes Decision"?',
'["A) Proceed immediately if the AI confidence score is high", "B) Use only free tools to save budget", "C) Require senior leadership review and conduct a formal bias assessment", "D) Document the prompt used in a shared spreadsheet"]',
2, 'High-stakes decisions require senior leadership review and a formal bias assessment.', 'hard', 'AI Security', true),

-- Question 10
('If you need to use an AI tool that is not currently on the approved list, what must you do?',
'["A) Use it only on your personal device", "B) Submit a tool request to IT for security evaluation and approval", "C) Use it for non-client work only", "D) Ask the tool provider for a security certificate"]',
1, 'If a tool is not approved, you must submit a request to IT for security evaluation before use.', 'medium', 'AI Security', true),

-- Question 11
('What is the correct email address to contact IT regarding AI tools and best practices?',
'["A) help@strategybrix.com", "B) support@strategybrix.com", "C) it@strategybrix.com", "D) ai-support@strategybrix.com"]',
2, 'The contact email provided for IT guidance is it@strategybrix.com.', 'easy', 'AI Security', true),

-- Question 12
('Why must you "Validate Citations Directly" when using AI?',
'["A) Because AI often formats citations in the wrong style", "B) To ensure the sources actually exist and support the claims being made", "C) To check if the author of the source is a client", "D) Because AI cannot access the internet"]',
1, 'You must ensure sources exist, are credible, and actually support the claims, as AI can fabricate them.', 'medium', 'AI Security', true),

-- Question 13
('Which of the following best describes the "Transparency & Accountability" principle?',
'["A) Always using open-source AI models", "B) Making all client data public for transparency", "C) Documenting AI tool usage and disclosing it clearly to stakeholders", "D) Allowing clients to log into StrategyBRIX AI tools"]',
2, 'Transparency & Accountability involves documenting AI usage and disclosing it clearly to clients.', 'medium', 'AI Security', true),

-- Question 14
('The training states that AI tools should be viewed as:',
'["A) A replacement for junior analysts", "B) A starting point, not a finished product", "C) The final authority on data analysis", "D) A way to bypass security controls"]',
1, 'AI provides a starting point, not a finished product; outputs must be customized and verified.', 'easy', 'AI Security', true),

-- Question 15
('What is the employee''s role described as in relation to AI?',
'["A) The passive observer", "B) The data entry specialist", "C) The guardian of quality and protector of client trust", "D) The beta tester for new software"]',
2, 'Employees are described as the guardian of quality and protector of client trust.', 'easy', 'AI Security', true),

-- Question 16
('What is the primary definition of phishing?',
'["A) Hacking into a server using brute force attacks", "B) Stealing physical documents from a trash can", "C) Fraudulent attempts to obtain sensitive info by disguising as a trustworthy entity", "D) Listening to phone calls without permission"]',
2, 'Phishing is defined as fraudulent attempts to obtain sensitive information by disguising as a trustworthy entity.', 'easy', 'Phishing', true),

-- Question 17
('Who is targeted by phishing attacks within the organization?',
'["A) Only the executive leadership team", "B) Only IT staff who have admin access", "C) Only new employees during their probationary period", "D) Anyone at any level of the organization"]',
3, 'Attackers do not discriminate; anyone from entry-level staff to executives is targeted.', 'easy', 'Phishing', true),

-- Question 18
('What is "Vishing"?',
'["A) Phishing attacks conducted via video chat", "B) Phone call attacks where scammers impersonate trusted entities", "C) Virus phishing through downloadable files", "D) Visual phishing using fake QR codes"]',
1, 'Vishing stands for Voice Phishing, involving phone call attacks impersonating trusted entities.', 'medium', 'Social Engineering', true),

-- Question 19
('Which of the following is a common "Red Flag" indicating a phishing attempt?',
'["A) The email uses your correct full name", "B) The message arrives during normal business hours", "C) The message pressures you to bypass established approval workflows", "D) The sender uses the official company domain name"]',
2, 'Pressure to bypass normal approval workflows or established protocols is a major red flag.', 'medium', 'Phishing', true),

-- Question 20
('What is a characteristic of a "Generic Greeting" in a phishing email?',
'["A) It uses your first and last name", "B) It addresses you by your specific job title", "C) It uses salutations like \"Dear Customer\"", "D) It references your specific department manager by name"]',
2, 'Phishing emails often use generic greetings like ''Dear Customer'' instead of your actual name.', 'easy', 'Phishing', true),

-- Question 21
('How can you spot a suspicious sender address even if the display name looks legitimate?',
'["A) By replying to the email and asking who they are", "B) By checking if the font size is correct", "C) By hovering over the sender''s name to reveal the actual email address", "D) By forwarding the email to your personal account"]',
2, 'Hovering over the display name reveals the actual email address, which may show misspellings or unusual domains.', 'medium', 'Phishing', true),

-- Question 22
('What is the "Hover Technique"?',
'["A) Hovering your mouse over a link to preview the actual destination URL", "B) Hovering your mouse over an attachment to scan it for viruses", "C) Waiting 5 seconds before opening an email", "D) Moving your mouse rapidly to prevent screen sleep"]',
0, 'The Hover Technique involves hovering over a link to see if the destination URL matches what you expect.', 'easy', 'Phishing', true),

-- Question 23
('Which of the following file types is listed as a dangerous attachment to be especially cautious of?',
'["A) .txt (Text file)", "B) .pdf (Portable Document Format)", "C) .png (Image file)", "D) .xlsm (Macro-enabled Excel document)"]',
3, 'Macro-enabled documents like .xlsm are listed as dangerous attachments to be cautious of.', 'medium', 'Phishing', true),

-- Question 24
('Which information should you NEVER share via email according to the training?',
'["A) Your weekly status report", "B) Meeting availability times", "C) Passwords or PINs", "D) Publicly available marketing brochures"]',
2, 'You should never share sensitive data like passwords, PINs, or Social Security numbers via email.', 'easy', 'Password Security', true),

-- Question 25
('Which scenario is an example of the "Too Good to Be True" red flag?',
'["A) An email from HR about open enrollment", "B) A notification about a software update scheduled for the weekend", "C) A request from your manager to review a document", "D) A notification that you won a lottery or contest you didn''t enter"]',
3, 'Winning a contest you didn''t enter is a classic ''Too Good to Be True'' phishing lure.', 'easy', 'Social Engineering', true),

-- Question 26
('In the STOP method for evaluating suspicious messages, what does the O stand for?',
'["A) Open the attachment", "B) Observe the red flags", "C) Organize your inbox", "D) Overwrite the sender details"]',
1, 'In the STOP method, O stands for Observe the red flags (sender address, urgency, etc.).', 'medium', 'Phishing', true),

-- Question 27
('What is the first step you should take if you receive a suspicious message?',
'["A) Reply to the sender to verify their identity", "B) Forward it to your colleagues to see if they got it too", "C) Do not interact (don''t click links or download attachments)", "D) Click the unsubscribe link at the bottom"]',
2, 'The first step is to ''Do Not Interact''--do not click links, download attachments, or reply.', 'medium', 'Phishing', true),

-- Question 28
('If you inadvertently click a suspicious link or download a malicious file, what should you do first?',
'["A) Wait to see if your computer starts acting strangely", "B) Disconnect from the network (Wi-Fi or cable) immediately", "C) Delete the email and pretend it didn''t happen", "D) Restart your computer three times"]',
1, 'If you download something suspicious, you must disconnect from the network immediately to prevent spread.', 'hard', 'Phishing', true),

-- Question 29
('Why is it recommended to delete a suspicious message AFTER reporting it?',
'["A) To free up space in your inbox", "B) To prevent accidental clicks in the future", "C) Because the IT team automatically deletes it from their end", "D) To hide the evidence of the attack"]',
1, 'You should delete the message after reporting it to prevent accidental clicks in the future.', 'medium', 'Phishing', true),

-- Question 30
('What is the best way to verify a suspicious request that appears to come from a known contact?',
'["A) Reply to the email asking \"Is this real?\"", "B) Use the contact information provided in the suspicious email signature", "C) Contact the person through a different channel, like a known phone number or Slack", "D) Ask a different colleague if they know the person"]',
2, 'Verify by contacting the person through a different channel, such as a known phone number or Slack, never using info from the suspicious message.', 'medium', 'Social Engineering', true);
