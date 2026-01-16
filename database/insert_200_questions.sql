-- Insert 200 quiz questions
-- Clear existing questions first
DELETE FROM quiz_questions;

INSERT INTO quiz_questions (question_text, options_json, correct_answer_index, explanation, difficulty, category, is_active) VALUES

-- Question 1
('You receive a browser popup claiming your ''Word'' application is broken and giving you instructions to copy and paste a script into your computer''s terminal (PowerShell) to fix it. What type of attack is this?',
'["A) Ransomware Injection", "B) ClickFix Attack", "C) SQL Injection", "D) Man-in-the-Middle"]',
1, 'This is a ''ClickFix'' attack. Attackers use fake error messages to trick users into pasting malicious code directly into their terminal, bypassing many security filters.', 'medium', 'Malware & Ransomware', true),

-- Question 2
('According to 2025 threat intelligence, what is the minimum amount of audio data an attacker needs to clone a person''s voice using AI?',
'["A) 10 minutes", "B) 1 minute", "C) 3 seconds", "D) 30 seconds"]',
2, 'Research shows that attackers now need only about three seconds of audio—often taken from social media or voicemails—to clone a voice with 85% accuracy.', 'medium', 'AI-Powered Threats', true),

-- Question 3
('You receive an email from ''HR'' with a PDF attachment regarding ''Benefits Enrollment.'' The PDF contains no text, only a large QR code to scan. What is the safest action?',
'["A) Scan it with your personal phone to keep it off the work network", "B) Scan it with your work phone to verify the link", "C) Do not scan it; navigate to the HR portal manually via your browser", "D) Forward it to your manager to see if they got it"]',
2, 'This is likely ''Quishing'' (QR Phishing). Attackers use QR codes in PDFs to bypass email text scanners. Scanning it directs you to a malicious site. Always navigate to known portals manually.', 'easy', 'Phishing & Email Security', true),

-- Question 4
('An attacker sends you a Microsoft Teams message from an external account that looks like a client''s name, sharing a ''SharePoint'' link. What tactic is the attacker using?',
'["A) Living Off Trusted Services (LOTS)", "B) Brute Force Attack", "C) DNS Poisoning", "D) Keylogging"]',
0, 'This is ''Living Off Trusted Services'' (LOTS). Attackers host malicious files on legitimate platforms like SharePoint or Teams to make the link appear safe and bypass security filters.', 'hard', 'Phishing & Email Security', true),

-- Question 5
('You receive a video call from the CFO demanding an urgent, confidential wire transfer. The video looks mostly real but the audio is slightly out of sync. What is your immediate next step?',
'["A) Process the transfer but note the glitch", "B) Ask the CFO to wave their hand to prove they are real", "C) Hang up and call the CFO back on their internal directory number", "D) Record the call for evidence"]',
2, 'This is the ''Verification Playbook'' for suspected Deepfakes. Always verify urgent financial requests out-of-band by calling a known, trusted number.', 'medium', 'AI-Powered Threats', true),

-- Question 6
('What is the primary danger of ''MFA Fatigue'' or ''Prompt Bombing'' attacks?',
'["A) It drains the battery of your mobile device", "B) It tricks the user into approving a login attempt out of frustration", "C) It locks the user out of their account permanently", "D) It intercepts the SMS code over the air"]',
1, 'MFA Fatigue involves sending repeated push notifications to a user''s device until they blindly approve one to stop the annoyance, granting the attacker access.', 'easy', 'Password Security & Authentication', true),

-- Question 7
('A recruiter on LinkedIn messages you with a job offer document. The file downloads as a ''.zip'' archive. Why is this suspicious?',
'["A) LinkedIn does not support zip files", "B) Zip files are too large for messaging", "C) Attackers use zip files to hide malicious executables from initial scans", "D) Job offers are never sent as documents"]',
2, 'Attackers frequently use .zip or encrypted archive files to hide malware from email and browser security scanners.', 'medium', 'Malware & Ransomware', true),

-- Question 8
('Which of the following authentication methods is considered ''Phishing-Resistant''?',
'["A) SMS One-Time Passcodes", "B) Mobile Push Notifications", "C) FIDO2 / WebAuthn Security Keys", "D) Email Magic Links"]',
2, 'FIDO2/WebAuthn keys are phishing-resistant because they bind the login credential to the specific domain, preventing attackers from using intercepted credentials on a fake site.', 'hard', 'Password Security & Authentication', true),

-- Question 9
('You are at a coffee shop and receive a text: ''Unpaid Toll: $4.50 due immediately to avoid $50 late fee.'' It includes a link to ''pay-toll-service.com''. What is this?',
'["A) A legitimate government notice", "B) Smishing (SMS Phishing)", "C) Vishing", "D) Bluesnarfing"]',
1, 'This is a classic Smishing attack using urgency and a small dollar amount to trick users into entering credit card details on a fake site.', 'easy', 'Mobile Device Security', true),

-- Question 10
('What is ''Shadow AI'' in a corporate environment?',
'["A) AI that operates in dark mode", "B) Employees using unauthorized AI tools for work, potentially leaking data", "C) AI used by hackers to crack passwords", "D) A backup AI system"]',
1, 'Shadow AI refers to employees putting sensitive company data into public AI tools (like ChatGPT) without approval, risking data exposure.', 'medium', 'Insider Threats', true),

-- Question 11
('An attacker compromises a vendor''s email account and replies to an existing invoice thread, asking you to update the bank account details for payment. What is this technique called?',
'["A) Thread Hijacking / Pretexting", "B) SQL Injection", "C) Brute Force", "D) Ransomware"]',
0, 'Thread Hijacking involves entering a legitimate conversation to build trust. Combined with a request to change payment info, it is a form of BEC pretexting.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 12
('Why is ''Hovering'' over a link less effective in 2025 than in previous years?',
'["A) Browsers no longer show previews", "B) Attackers use ''Open Redirects'' on legitimate sites (e.g., google.com/url?q=malicious)", "C) Mice no longer support hovering", "D) It is still 100% effective"]',
1, 'Attackers now use ''Open Redirects'' on trusted domains or legitimate cloud hosting links that look safe when hovered over but redirect to a malicious site after clicking.', 'hard', 'Phishing & Email Security', true),

-- Question 13
('A website popup asks you to ''Press Verify'' to confirm you are human. Doing so copies code to your clipboard and asks you to run it. What is this attack vector?',
'["A) CAPTCHA Bypass", "B) Malicious Copy-and-Paste (ClickFix)", "C) Cookie Theft", "D) DDoS"]',
1, 'This is a variation of the ClickFix or ''Paste-and-Run'' attack, where social engineering tricks the user into executing malicious code pasted from their clipboard.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 14
('Which of the following is a physical security risk associated with hybrid work?',
'["A) Shoulder Surfing", "B) Phishing", "C) DDoS", "D) SQL Injection"]',
0, 'Shoulder surfing involves unauthorized persons viewing your screen in public places like cafes or trains, a major risk for remote workers.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 15
('You receive a request to download an ''authenticator'' app to view an encrypted message. The app is not from the official app store. What is the risk?',
'["A) It will take up too much storage", "B) It is likely ''Sideloaded'' malware designed to steal data", "C) It is a beta version of a real app", "D) It will void your phone warranty"]',
1, 'Attackers often use fake security apps or viewers hosted outside official stores to install malware on mobile devices.', 'medium', 'Mobile Device Security', true),

-- Question 16
('In the context of 2025 threats, what does ''AiTM'' stand for regarding phishing?',
'["A) AI-Targeted Malware", "B) Adversary-in-the-Middle", "C) Automated Internet Threat Monitor", "D) Anti-intelligent Threat Management"]',
1, 'Adversary-in-the-Middle (AiTM) phishing uses a proxy server to intercept the user''s password and session cookie (MFA token) in real-time.', 'hard', 'Phishing & Email Security', true),

-- Question 17
('What is the ''Clean Desk Policy'' designed to prevent?',
'["A) Dust accumulation on computers", "B) Unauthorized viewing of sensitive documents left unattended", "C) Loss of office supplies", "D) Improving office aesthetics"]',
1, 'A Clean Desk Policy ensures sensitive information (passwords on post-its, printed contracts) is not left exposed to visitors or unauthorized staff.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 18
('You find a USB drive labeled ''Q3 Executive Bonuses'' in the parking lot. What should you do?',
'["A) Plug it in to find the owner", "B) Give it to the reception desk", "C) Do not plug it in; hand it directly to the IT Security team", "D) Throw it in the trash"]',
2, 'This is a ''Baiting'' attack. Plugging it in can install malware. It should be handled by IT security for analysis/disposal.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 19
('What is a ''Synthetic Identity''?',
'["A) A robot employee", "B) A fake persona created by combining real and fake data (e.g., real SSN, fake name)", "C) An alias used by a celebrity", "D) A temporary guest account"]',
1, 'Synthetic identities mix real and fake information to create a new persona that can pass some verification checks, often used for fraud or insider entry.', 'medium', 'AI-Powered Threats', true),

-- Question 20
('Why should you avoid using public USB charging stations (''Juice Jacking'')?',
'["A) They charge phones too slowly", "B) They can transfer malware or steal data through the data pins in the cable", "C) They may surge and damage the battery", "D) They are expensive"]',
1, 'Juice Jacking exploits the fact that USB cables transfer both power and data. A compromised port can steal data from the connected device.', 'medium', 'Mobile Device Security', true),

-- Question 21
('A ''Consent Phishing'' attack typically tricks a user into doing what?',
'["A) Resetting their password", "B) Granting a malicious app permission to access their Office 365/Google data", "C) Downloading a virus", "D) Sending a wire transfer"]',
1, 'Consent phishing abuses OAuth permissions. It tricks users into granting a malicious app legitimate access to read emails or files without needing the password.', 'hard', 'Phishing & Email Security', true),

-- Question 22
('Which of the following is a sign of a potential Insider Threat?',
'["A) An employee logging in during normal hours", "B) An employee downloading large amounts of data just before resigning", "C) An employee asking for IT help", "D) An employee changing their password"]',
1, 'Unusual data exfiltration, especially prior to departure, is a classic indicator of an insider threat taking IP or client lists.', 'medium', 'Insider Threats', true),

-- Question 23
('If a website asks you to allow ''Notifications'' to verify you are not a robot, what is the risk?',
'["A) It slows down your browser", "B) It allows the site to spam you with ads and fake malware alerts", "C) It captures your webcam", "D) It stops the page from loading"]',
1, 'Browser notification abuse is used to bombard users with fake ''Your PC is infected'' popups later, driving them to tech support scams.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 24
('What is the best practice for using Wi-Fi while working remotely in a public space?',
'["A) Use the ''Free Public Wi-Fi'' network", "B) Use a VPN (Virtual Private Network) or a cellular hotspot", "C) Only use websites that end in .com", "D) Use Incognito mode"]',
1, 'VPNs encrypt your traffic, protecting it from interception on insecure public Wi-Fi networks. Cellular hotspots are also generally more secure.', 'easy', 'Remote Work Security', true),

-- Question 25
('An email from a known vendor arrives with an invoice, but the tone is aggressive and demands payment today to avoid service cancellation. What should you do?',
'["A) Pay it immediately to avoid disruption", "B) Reply to the email asking if they are serious", "C) Call the vendor using the number on file (not in the email) to verify", "D) Forward it to Accounts Payable"]',
2, 'Urgency and aggression are key social engineering tactics. Even if the sender looks known, verify out-of-band.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 26
('What is ''Credential Stuffing''?',
'["A) Typing a password too quickly", "B) Using stolen username/password pairs from one breach to try and login to other sites", "C) Storing passwords in a spreadsheet", "D) Sharing passwords with colleagues"]',
1, 'Credential stuffing exploits password reuse. Attackers take credentials leaked from Site A and try them on Site B, C, and D.', 'medium', 'Password Security & Authentication', true),

-- Question 27
('You receive a LinkedIn message from a ''recruiter'' offering a high-paying remote job, but they ask you to install a specific chat app to interview. What is the risk?',
'["A) It is a pyramid scheme", "B) The app may be malware or the job is a pretext for data theft", "C) LinkedIn forbids external chatting", "D) The job might be boring"]',
1, 'Fake job offers are a common lure to get users to install malware or provide sensitive PII for ''background checks'' before a job even exists.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 28
('When generating a password, what makes it ''strong''?',
'["A) Using your pet''s name", "B) Using a common dictionary word", "C) Length (12+ chars), complexity, and uniqueness", "D) Replacing ''a'' with ''@''"]',
2, 'Length and randomness are the most important factors. Passphrases or random strings managed by a password manager are best.', 'easy', 'Password Security & Authentication', true),

-- Question 29
('What is the primary function of Ransomware?',
'["A) To steal credit card numbers quietly", "B) To encrypt files and demand payment for the decryption key", "C) To slow down the internet", "D) To mine cryptocurrency"]',
1, 'Ransomware denies access to data by encrypting it, holding the data ''hostage'' until a ransom is paid.', 'easy', 'Malware & Ransomware', true),

-- Question 30
('What is ''Tailgating'' in a physical security context?',
'["A) Eating lunch in the parking lot", "B) Following an authorized person through a secure door without badging in", "C) Driving too close to another car", "D) Leaving the back door open"]',
1, 'Tailgating exploits politeness. An unauthorized person follows an employee through a secure door to gain physical access.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 31
('Why is it dangerous to use the same password for both work and personal accounts?',
'["A) You might forget it", "B) If one account is breached, attackers can access all other accounts using that password", "C) It is against the law", "D) It confuses the password manager"]',
1, 'Password reuse creates a domino effect. A breach of a low-security personal site can lead to the compromise of a high-security work account.', 'easy', 'Password Security & Authentication', true),

-- Question 32
('Which file extension is commonly blocked by email filters because it can execute code?',
'["A) .txt", "B) .jpg", "C) .exe", "D) .pdf"]',
2, '.exe (executable) files are high-risk and almost universally blocked. Attackers now wrap them in .zip or .iso files to hide them.', 'medium', 'Malware & Ransomware', true),

-- Question 33
('What is the ''3-2-1'' rule regarding data backups?',
'["A) 3 copies, 2 different media types, 1 offsite", "B) 3 passwords, 2 users, 1 account", "C) 3 days a week, 2 hours a day, 1 person", "D) 3 files, 2 folders, 1 drive"]',
0, 'The 3-2-1 rule is the industry standard for backups: 3 total copies of data, on 2 different types of media, with 1 copy stored offsite (cloud/physical).', 'medium', 'Data Protection & Privacy', true),

-- Question 34
('You receive an email with the subject ''URGENT: Invoice Overdue'' from ''account-support@amazon-security-alert.com''. What is the red flag?',
'["A) Amazon doesn''t send invoices", "B) The domain ''amazon-security-alert.com'' is a spoofed look-alike domain", "C) The subject line is in caps", "D) It was sent on a Tuesday"]',
1, 'The domain is a spoof. Legitimate emails come from amazon.com, not long, hyphenated domains that merely contain the brand name.', 'medium', 'Phishing & Email Security', true),

-- Question 35
('In a ''Watering Hole'' attack, what does the hacker do?',
'["A) Poisons the office water supply", "B) Infects a legitimate website frequently visited by the target group", "C) Sends phishing emails to everyone", "D) Hacks the Wi-Fi at a coffee shop"]',
1, 'Attackers compromise a specific site they know their targets visit (like an industry forum) to infect them with malware.', 'hard', 'Social Engineering & Pretexting', true),

-- Question 36
('What is ''Vishing''?',
'["A) Video Phishing", "B) Voice Phishing (using the phone)", "C) Virtual Phishing", "D) Verified Phishing"]',
1, 'Vishing involves attackers calling victims on the phone, often posing as IT support or banks, to steal information.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 37
('When discarding physical documents containing client data, what is the required method?',
'["A) Recycle bin", "B) Trash can", "C) Cross-cut shredding or secure disposal bin", "D) Tearing it in half"]',
2, 'Sensitive documents must be rendered unreadable, typically via cross-cut shredding, to prevent dumpster diving.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 38
('A ''Drive-by Download'' refers to:',
'["A) Downloading files while driving", "B) Unintentional download of malicious code simply by visiting a compromised website", "C) Sharing files via USB", "D) Downloading via Wi-Fi"]',
1, 'Drive-by downloads occur without user interaction, often exploiting browser vulnerabilities when a user visits an infected page.', 'hard', 'Malware & Ransomware', true),

-- Question 39
('What is the safest way to store your passwords?',
'["A) In a notebook in your drawer", "B) In a Sticky Note on your desktop", "C) In a dedicated Password Manager", "D) In your email drafts"]',
2, 'Password Managers encrypt credentials and allow for complex, unique passwords for every site without memorization.', 'easy', 'Password Security & Authentication', true),

-- Question 40
('You receive a calendar invite for a ''mandatory meeting'' from an unknown external address. The description contains a link to join. What should you do?',
'["A) Click the link to see who it is", "B) Accept the invite", "C) Report it as spam/phishing and do not click", "D) Reply asking for an agenda"]',
2, 'Calendar phishing injects malicious links into calendars. Clicking can verify your email is active or lead to malware.', 'medium', 'Phishing & Email Security', true),

-- Question 41
('What does ''HTTPS'' indicate in a URL?',
'["A) The site is 100% safe", "B) The connection between you and the site is encrypted", "C) The site cannot be hacked", "D) The site is hosted in the US"]',
1, 'HTTPS means the data in transit is encrypted. However, phishing sites can also use HTTPS, so it does not guarantee the site itself is legitimate.', 'medium', 'Data Protection & Privacy', true),

-- Question 42
('Why are ''Macros'' in Microsoft Office documents a security risk?',
'["A) They make the file size too big", "B) They can contain embedded malware scripts that run when enabled", "C) They are incompatible with Macs", "D) They delete the document text"]',
1, 'Macros are scripts used for automation, but attackers use them to download and install malware. Never enable macros from untrusted sources.', 'medium', 'Malware & Ransomware', true),

-- Question 43
('What is ''Bluebugging'' or ''Bluesnarfing''?',
'["A) Malware that turns your screen blue", "B) Exploiting Bluetooth connections to steal data or control a device", "C) Phishing via Facebook", "D) Water damage to a phone"]',
1, 'These attacks exploit discoverable Bluetooth connections to access data on mobile devices.', 'hard', 'Mobile Device Security', true),

-- Question 44
('An employee uses their personal email to send confidential work documents to themselves to ''work from home''. This is an example of:',
'["A) Proactive productivity", "B) Data Exfiltration / Insider Risk", "C) Cloud Computing", "D) Encrypted Transfer"]',
1, 'Moving data to unmanaged, personal accounts (even with good intent) removes corporate security controls and is a form of data exfiltration.', 'medium', 'Insider Threats', true),

-- Question 45
('Which of the following is an example of ''Pretexting''?',
'["A) A hacker calling and pretending to be IT support needing your password to fix a glitch", "B) Sending a virus", "C) Guessing a password", "D) Stealing a laptop"]',
0, 'Pretexting involves creating a fabricated scenario (the pretext) to steal information. Impersonating IT support is a classic example.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 46
('What is the main risk of ''Oversharing'' on social media regarding cybersecurity?',
'["A) People will get jealous", "B) Attackers use personal details (pet names, birthdays, travel) to guess passwords or craft spear-phishing attacks", "C) It uses too much data", "D) It violates copyright"]',
1, 'Open Source Intelligence (OSINT) gathered from social media helps attackers build convincing profiles for social engineering.', 'easy', 'Data Protection & Privacy', true),

-- Question 47
('A ''Logic Bomb'' is:',
'["A) A heated argument in the office", "B) Malicious code inserted into software that executes only when specific conditions are met", "C) A type of battery", "D) A phishing email"]',
1, 'Logic bombs lie dormant until a trigger event (like a date or an employee being fired) causes them to execute malicious actions.', 'hard', 'Insider Threats', true),

-- Question 48
('What is the purpose of a VPN (Virtual Private Network)?',
'["A) To speed up the internet", "B) To encrypt internet traffic and mask the user''s IP address", "C) To clean viruses", "D) To create strong passwords"]',
1, 'VPNs create a secure tunnel for data, essential when using untrusted networks like public Wi-Fi.', 'medium', 'Remote Work Security', true),

-- Question 49
('You receive a text from your CEO asking you to buy gift cards for a client meeting right now. What is this?',
'["A) A standard business practice", "B) CEO Fraud / Smishing", "C) A loyalty test", "D) A system error"]',
1, 'Gift card requests from executives are a hallmark of CEO Fraud. Executives do not conduct business via gift cards over text.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 50
('What does ''GDPR'' primarily protect?',
'["A) Government secrets", "B) Personal data and privacy of EU citizens", "C) Corporate patents", "D) Software copyrights"]',
1, 'The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy.', 'medium', 'Data Protection & Privacy', true),

-- Question 51
('Why should you disable ''Auto-Join'' for Wi-Fi networks on your phone?',
'["A) It saves battery", "B) It prevents your device from connecting to rogue hotspots with common names (like ''attwifi'')", "C) It makes the internet faster", "D) It stops updates"]',
1, 'Attackers set up rogue hotspots with common names. If Auto-Join is on, your device may connect to the attacker''s network automatically.', 'medium', 'Mobile Device Security', true),

-- Question 52
('A ''Man-in-the-Middle'' (MitM) attack involves:',
'["A) An attacker physically standing between two people", "B) An attacker intercepting and possibly altering communication between two parties without their knowledge", "C) A server crash", "D) Blocking an email"]',
1, 'MitM attacks intercept data in transit, often on insecure Wi-Fi, allowing attackers to read or modify messages.', 'medium', 'Malware & Ransomware', true),

-- Question 53
('What is the ''Principle of Least Privilege''?',
'["A) Giving everyone admin access", "B) Users should only have the access levels necessary to perform their job functions", "C) New employees get no access for a month", "D) Managers get all access"]',
1, 'Least Privilege limits the potential damage if an account is compromised by restricting access to only what is essential.', 'medium', 'Data Protection & Privacy', true),

-- Question 54
('You are selling an item online and the buyer sends a check for more than the asking price, asking you to wire back the difference. What is this?',
'["A) A generous tip", "B) An Overpayment Scam", "C) A banking error", "D) Legitimate transaction"]',
1, 'This is an Overpayment Scam. The check is fake, but it takes time to bounce. If you wire the ''difference'' back, you lose your own money.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 55
('What is ''Typosquatting''?',
'["A) Standing up while typing", "B) Registering domains that are very similar to popular sites (e.g., goggle.com instead of google.com)", "C) Hacking a keyboard", "D) Deleting emails"]',
1, 'Typosquatting relies on users making typing errors to land on malicious sites that look like the intended destination.', 'easy', 'Phishing & Email Security', true),

-- Question 56
('If a USB drive is plugged into your computer and a window pops up asking to ''Install Drivers'' unexpectedly, what should you do?',
'["A) Click Yes", "B) Click No and remove the drive immediately", "C) Restart the computer", "D) Ignore it"]',
1, 'Unexpected driver installation requests from USBs are often malicious payloads (like USB Rubber Ducky attacks). Remove the device.', 'medium', 'Physical Security & Clean Desk', true),

-- Question 57
('What is a ''Zero-Day'' vulnerability?',
'["A) A virus that deletes data in zero days", "B) A software flaw known to the vendor but with no patch available yet", "C) A computer that is brand new", "D) A calendar error"]',
1, 'Zero-day vulnerabilities are dangerous because attackers can exploit them before the software creator has released a fix.', 'hard', 'Malware & Ransomware', true),

-- Question 58
('Why is ''HTTP'' (without the S) insecure for entering passwords?',
'["A) It is slower", "B) It sends data in clear text, meaning anyone monitoring the network can read it", "C) It is illegal", "D) It doesn''t work on mobile"]',
1, 'HTTP transmits data in clear text. Passwords sent over HTTP can be easily sniffed by attackers on the same network.', 'easy', 'Data Protection & Privacy', true),

-- Question 59
('What is the primary function of a ''Keylogger''?',
'["A) To organize your keys", "B) To record every keystroke made on a computer to steal passwords and data", "C) To unlock software", "D) To log into websites automatically"]',
1, 'Keyloggers are malware or hardware used to capture sensitive info like passwords as the user types them.', 'easy', 'Malware & Ransomware', true),

-- Question 60
('You receive a phone call from ''Microsoft Support'' claiming your computer has a virus. They ask for remote access to fix it. What is this?',
'["A) Helpful customer service", "B) Tech Support Scam", "C) Routine maintenance", "D) A Windows update"]',
1, 'Tech giants like Microsoft do not call customers unsolicited to fix viruses. This is a scam to gain remote access and steal money/data.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 61
('What is the recommended minimum length for a secure password in 2025?',
'["A) 6 characters", "B) 8 characters", "C) 12-16 characters", "D) 4 characters"]',
2, 'Modern computing power makes shorter passwords easy to crack. 12-16 characters with complexity is now the recommended minimum.', 'easy', 'Password Security & Authentication', true),

-- Question 62
('What is ''Spear Phishing''?',
'["A) Fishing with a spear", "B) A targeted phishing attack aimed at a specific individual or organization", "C) Mass email spam", "D) Phishing via social media"]',
1, 'Spear phishing uses personalized information to target specific individuals, making it more convincing than generic phishing.', 'medium', 'Phishing & Email Security', true),

-- Question 63
('What should you do if you accidentally click on a suspicious link?',
'["A) Ignore it", "B) Immediately disconnect from the network and report to IT Security", "C) Clear your browser history", "D) Restart your computer"]',
1, 'Quick action can prevent malware spread. Disconnect and report so IT can assess and contain any potential threat.', 'medium', 'Phishing & Email Security', true),

-- Question 64
('What is ''Social Engineering''?',
'["A) Building social networks", "B) Manipulating people into divulging confidential information or taking actions", "C) Engineering social media apps", "D) Creating fake profiles"]',
1, 'Social engineering exploits human psychology rather than technical vulnerabilities to gain access or information.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 65
('What is a ''Botnet''?',
'["A) A network of robots", "B) A network of compromised computers controlled remotely by attackers", "C) A chat room", "D) A security software"]',
1, 'Botnets are used for DDoS attacks, spam distribution, and other malicious activities using infected computers.', 'medium', 'Malware & Ransomware', true),

-- Question 66
('What is ''Whaling''?',
'["A) Hunting whales", "B) Phishing attacks specifically targeting high-level executives", "C) Large-scale spam", "D) Network monitoring"]',
1, 'Whaling targets CEOs, CFOs, and other executives who have access to sensitive data and financial authority.', 'medium', 'Phishing & Email Security', true),

-- Question 67
('What is the purpose of ''Two-Factor Authentication'' (2FA)?',
'["A) To make login slower", "B) To add an extra layer of security beyond just a password", "C) To replace passwords", "D) To track user location"]',
1, '2FA requires something you know (password) plus something you have (phone/token), making unauthorized access harder.', 'easy', 'Password Security & Authentication', true),

-- Question 68
('What is a ''Firewall''?',
'["A) A wall that prevents fires", "B) A security system that monitors and controls incoming/outgoing network traffic", "C) A type of antivirus", "D) A backup system"]',
1, 'Firewalls act as barriers between trusted internal networks and untrusted external networks like the internet.', 'easy', 'Data Protection & Privacy', true),

-- Question 69
('What is ''Pharming''?',
'["A) Online farming games", "B) Redirecting website traffic to a fraudulent site without the user''s knowledge", "C) Phishing via pharmacy websites", "D) Growing malware"]',
1, 'Pharming manipulates DNS settings to redirect users from legitimate sites to fake ones, even if they type the correct URL.', 'hard', 'Phishing & Email Security', true),

-- Question 70
('What should you do before disposing of an old work computer or phone?',
'["A) Just delete the files", "B) Ensure all data is securely wiped or the device is physically destroyed", "C) Give it to a friend", "D) Sell it online"]',
1, 'Deleted files can often be recovered. Secure wiping or physical destruction ensures sensitive data cannot be retrieved.', 'medium', 'Data Protection & Privacy', true),

-- Question 71
('What is ''Dumpster Diving'' in cybersecurity?',
'["A) Swimming in dumpsters", "B) Searching through trash for sensitive information like documents or hardware", "C) Recycling old computers", "D) Cleaning servers"]',
1, 'Attackers search discarded materials for passwords, account numbers, or other sensitive information.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 72
('What is the risk of using ''Remember Me'' on shared computers?',
'["A) It uses too much memory", "B) The next user can access your accounts without credentials", "C) It slows down the computer", "D) It expires quickly"]',
1, 'Remember Me stores authentication tokens that allow anyone using that computer to access your account.', 'easy', 'Password Security & Authentication', true),

-- Question 73
('What is ''Encryption''?',
'["A) Deleting files", "B) Converting data into a coded format that can only be read with a key", "C) Compressing files", "D) Backing up data"]',
1, 'Encryption protects data confidentiality by making it unreadable to anyone without the decryption key.', 'easy', 'Data Protection & Privacy', true),

-- Question 74
('What is a ''Trojan Horse'' in cybersecurity?',
'["A) A wooden horse statue", "B) Malware disguised as legitimate software", "C) A security tool", "D) A type of firewall"]',
1, 'Trojans appear to be useful programs but contain hidden malicious code that activates once installed.', 'easy', 'Malware & Ransomware', true),

-- Question 75
('What is ''Phishing-as-a-Service'' (PhaaS)?',
'["A) A legitimate email service", "B) Criminal services that sell ready-made phishing kits to other attackers", "C) Anti-phishing software", "D) A government program"]',
1, 'PhaaS lowers the barrier for cybercrime by providing tools and infrastructure for launching phishing campaigns.', 'hard', 'Phishing & Email Security', true),

-- Question 76
('What is the danger of ''Public Wi-Fi'' without VPN?',
'["A) Slower speeds", "B) Attackers can intercept your unencrypted data transmissions", "C) Higher costs", "D) Battery drain"]',
1, 'Public Wi-Fi networks often lack encryption, allowing attackers to capture sensitive data like passwords and emails.', 'easy', 'Remote Work Security', true),

-- Question 77
('What is ''Session Hijacking''?',
'["A) Stealing a meeting room", "B) Taking over a user''s active session after they''ve authenticated", "C) Scheduling conflicts", "D) Video call interruption"]',
1, 'Attackers steal session tokens to impersonate authenticated users without needing their credentials.', 'hard', 'Password Security & Authentication', true),

-- Question 78
('What is a ''Security Patch''?',
'["A) A physical patch for computers", "B) A software update that fixes security vulnerabilities", "C) A network cable", "D) A backup file"]',
1, 'Patches address known vulnerabilities. Delaying updates leaves systems exposed to known exploits.', 'easy', 'Malware & Ransomware', true),

-- Question 79
('What is ''Business Email Compromise'' (BEC)?',
'["A) Using work email for personal use", "B) Attackers impersonating executives or vendors to trick employees into transfers or data disclosure", "C) Email server maintenance", "D) Changing email passwords"]',
1, 'BEC attacks often result in significant financial losses by exploiting trust in business relationships.', 'medium', 'Phishing & Email Security', true),

-- Question 80
('What is the purpose of ''Data Loss Prevention'' (DLP) software?',
'["A) To recover lost files", "B) To prevent sensitive data from leaving the organization unauthorized", "C) To delete old data", "D) To compress files"]',
1, 'DLP monitors and blocks attempts to transfer sensitive data outside approved channels.', 'medium', 'Data Protection & Privacy', true),

-- Question 81
('What is ''Rootkit''?',
'["A) A gardening tool", "B) Malware designed to hide its presence and maintain persistent access to a system", "C) A system administrator tool", "D) A type of antivirus"]',
1, 'Rootkits operate at deep system levels, making them extremely difficult to detect and remove.', 'hard', 'Malware & Ransomware', true),

-- Question 82
('What should you check before entering credentials on a website?',
'["A) The website colors", "B) The URL matches the legitimate site and uses HTTPS", "C) The page loading speed", "D) The number of images"]',
1, 'Verifying the URL and HTTPS helps identify phishing sites that mimic legitimate services.', 'easy', 'Phishing & Email Security', true),

-- Question 83
('What is ''Shoulder Surfing''?',
'["A) A water sport", "B) Observing someone''s screen or keyboard to steal information", "C) A massage technique", "D) Network scanning"]',
0, 'Shoulder surfing is low-tech but effective, especially in crowded public spaces.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 84
('What is a ''Honeypot'' in cybersecurity?',
'["A) A container for honey", "B) A decoy system designed to attract and trap attackers", "C) A type of malware", "D) A password storage"]',
1, 'Honeypots help organizations study attack methods and divert attackers from real systems.', 'hard', 'Data Protection & Privacy', true),

-- Question 85
('What is ''Cryptojacking''?',
'["A) Stealing cryptocurrency wallets", "B) Unauthorized use of someone''s computer to mine cryptocurrency", "C) Encrypting files for ransom", "D) Trading crypto"]',
1, 'Cryptojacking slows down systems and increases power consumption while generating cryptocurrency for attackers.', 'medium', 'Malware & Ransomware', true),

-- Question 86
('What is the risk of ''Browser Extensions'' from unknown sources?',
'["A) They slow down browsing", "B) They can steal data, inject ads, or monitor your activity", "C) They use too much storage", "D) They change browser colors"]',
1, 'Malicious extensions have full access to your browsing data and can modify web content.', 'medium', 'Mobile Device Security', true),

-- Question 87
('What is ''Fileless Malware''?',
'["A) Malware without a file extension", "B) Malware that operates entirely in memory without leaving files on disk", "C) Empty malware", "D) Deleted malware"]',
1, 'Fileless malware evades traditional antivirus by not writing to disk, making detection harder.', 'hard', 'Malware & Ransomware', true),

-- Question 88
('What is the ''Human Firewall''?',
'["A) A physical security guard", "B) Employees trained to recognize and resist social engineering attacks", "C) A software program", "D) A network device"]',
1, 'Security-aware employees are often the last line of defense against social engineering attacks.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 89
('What should you do if you receive an unexpected attachment from a known contact?',
'["A) Open it immediately", "B) Verify with the sender through a different channel before opening", "C) Forward it to others", "D) Delete all emails from that contact"]',
1, 'The sender''s account may be compromised. Always verify unexpected attachments through a separate communication method.', 'medium', 'Phishing & Email Security', true),

-- Question 90
('What is ''DNS Spoofing''?',
'["A) Changing your DNS server", "B) Corrupting DNS cache to redirect users to malicious websites", "C) Speeding up DNS", "D) Blocking DNS"]',
1, 'DNS spoofing makes users believe they''re visiting legitimate sites while actually connecting to attacker-controlled servers.', 'hard', 'Malware & Ransomware', true),

-- Question 91
('What is the purpose of ''Endpoint Detection and Response'' (EDR)?',
'["A) To manage email", "B) To continuously monitor and respond to threats on endpoints like laptops and phones", "C) To edit documents", "D) To create backups"]',
1, 'EDR provides visibility into endpoint activities and enables rapid response to detected threats.', 'medium', 'Data Protection & Privacy', true),

-- Question 92
('What is ''Angler Phishing''?',
'["A) Phishing while fishing", "B) Attackers posing as customer service on social media to steal credentials", "C) Email phishing", "D) Phone phishing"]',
1, 'Attackers monitor social media for complaints and pose as support staff to harvest credentials.', 'medium', 'Phishing & Email Security', true),

-- Question 93
('What is a ''Supply Chain Attack''?',
'["A) Attacking delivery trucks", "B) Compromising software or hardware during the development or distribution process", "C) Stealing inventory", "D) Disrupting shipping"]',
1, 'Supply chain attacks target the less-secure elements in a supply network to compromise the final product.', 'hard', 'Malware & Ransomware', true),

-- Question 94
('What is ''Security Awareness Training''?',
'["A) Military training", "B) Education programs to help employees recognize and avoid security threats", "C) Physical fitness training", "D) Software training"]',
1, 'Regular training keeps employees updated on current threats and proper security practices.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 95
('What is the risk of ''Jailbreaking'' or ''Rooting'' a mobile device?',
'["A) Voiding the warranty only", "B) Removing built-in security protections, making the device vulnerable to malware", "C) Making it faster", "D) Changing the color scheme"]',
1, 'Jailbreaking removes security restrictions that protect against malware and unauthorized access.', 'medium', 'Mobile Device Security', true),

-- Question 96
('What is ''Data Masking''?',
'["A) Hiding data under a physical mask", "B) Obscuring sensitive data so it can be used for testing without exposing real information", "C) Deleting data", "D) Encrypting data"]',
1, 'Data masking protects sensitive information in non-production environments while maintaining data usefulness.', 'medium', 'Data Protection & Privacy', true),

-- Question 97
('What is a ''Watering Hole'' attack?',
'["A) Attacking water supplies", "B) Infecting websites frequently visited by targeted victims", "C) Flooding networks", "D) Email spam"]',
1, 'Attackers research their targets'' browsing habits and compromise sites they frequently visit.', 'hard', 'Social Engineering & Pretexting', true),

-- Question 98
('What is the importance of ''Incident Response Plan''?',
'["A) To plan office parties", "B) To have a structured approach for handling security breaches and minimizing damage", "C) To schedule meetings", "D) To manage projects"]',
1, 'A well-prepared incident response plan reduces confusion and speeds up recovery during a security incident.', 'medium', 'Data Protection & Privacy', true),

-- Question 99
('What is ''Pretexting'' in social engineering?',
'["A) Sending text messages", "B) Creating a fabricated scenario to manipulate victims into providing information", "C) Writing articles", "D) Posting on social media"]',
1, 'Pretexting often involves impersonation and detailed backstories to gain trust.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 100
('What is a ''Brute Force Attack''?',
'["A) Physical attack on servers", "B) Systematically trying all possible password combinations until the correct one is found", "C) DDoS attack", "D) Social engineering"]',
1, 'Brute force attacks are why complex, long passwords and account lockout policies are important.', 'easy', 'Password Security & Authentication', true),

-- Question 101
('What is ''Privilege Escalation''?',
'["A) Getting promoted", "B) Gaining higher access rights than originally assigned, often through exploits", "C) Elevator access", "D) VIP treatment"]',
1, 'Attackers use privilege escalation to move from limited access to administrator-level control.', 'hard', 'Malware & Ransomware', true),

-- Question 102
('What is the danger of posting vacation plans on social media?',
'["A) Friends might get jealous", "B) Attackers know your home is empty and may target you for physical or cyber crimes", "C) It uses data", "D) Nothing"]',
1, 'Public vacation posts signal when your home and possibly work accounts are unmonitored.', 'easy', 'Data Protection & Privacy', true),

-- Question 103
('What is ''Multi-Factor Authentication'' (MFA)?',
'["A) Having multiple passwords", "B) Using two or more verification methods (password, phone, biometrics) to access an account", "C) Multiple user accounts", "D) Multiple email addresses"]',
1, 'MFA significantly reduces the risk of account compromise even if the password is stolen.', 'easy', 'Password Security & Authentication', true),

-- Question 104
('What is a ''Security Token''?',
'["A) A coin", "B) A physical or digital device that generates one-time codes for authentication", "C) A receipt", "D) A bookmark"]',
1, 'Security tokens add an extra layer of authentication that changes with each login attempt.', 'medium', 'Password Security & Authentication', true),

-- Question 105
('What is ''Spyware''?',
'["A) Software for spies", "B) Software that secretly monitors user activity and collects information", "C) Security software", "D) Productivity software"]',
1, 'Spyware can capture keystrokes, screenshots, and browsing history without the user''s knowledge.', 'easy', 'Malware & Ransomware', true),

-- Question 106
('What is the risk of using default passwords on devices?',
'["A) They''re hard to remember", "B) Attackers know default passwords and can easily access your devices", "C) They expire quickly", "D) Nothing"]',
1, 'Default passwords are publicly documented and are the first thing attackers try.', 'easy', 'Password Security & Authentication', true),

-- Question 107
('What is ''Network Segmentation''?',
'["A) Cutting network cables", "B) Dividing a network into smaller parts to limit the spread of attacks", "C) Combining networks", "D) Speeding up networks"]',
1, 'Segmentation contains breaches to specific network sections, preventing lateral movement.', 'medium', 'Data Protection & Privacy', true),

-- Question 108
('What is a ''Digital Footprint''?',
'["A) Computer-shaped footprint", "B) The trail of data you leave behind when using the internet", "C) A file format", "D) A login method"]',
1, 'Your digital footprint can be used by attackers to gather information for targeted attacks.', 'easy', 'Data Protection & Privacy', true),

-- Question 109
('What is ''Baiting'' in cybersecurity?',
'["A) Fishing technique", "B) Leaving malware-infected media (like USBs) for victims to find and use", "C) Email marketing", "D) Network testing"]',
1, 'Baiting exploits human curiosity by leaving infected devices in locations targets will find them.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 110
('What is the purpose of ''Access Control Lists'' (ACLs)?',
'["A) Guest lists for parties", "B) Rules that define who can access specific resources and what they can do", "C) Shopping lists", "D) Contact lists"]',
1, 'ACLs enforce the principle of least privilege by specifying exactly what each user can access.', 'medium', 'Data Protection & Privacy', true),

-- Question 111
('What is ''Clickjacking''?',
'["A) Stealing computer mice", "B) Tricking users into clicking on hidden elements on a webpage", "C) Fast typing", "D) Mouse testing"]',
1, 'Clickjacking overlays invisible malicious content over legitimate buttons or links.', 'hard', 'Phishing & Email Security', true),

-- Question 112
('What should you do if you notice unauthorized activity on your work account?',
'["A) Ignore it", "B) Immediately report to IT Security and change your password", "C) Delete your account", "D) Wait and see"]',
1, 'Quick reporting allows IT to investigate, contain the breach, and prevent further damage.', 'easy', 'Password Security & Authentication', true),

-- Question 113
('What is a ''Denial of Service'' (DoS) attack?',
'["A) Refusing to provide service", "B) Overwhelming a system with traffic to make it unavailable to users", "C) Closing a business", "D) Canceling subscriptions"]',
1, 'DoS attacks disrupt business operations by making services inaccessible to legitimate users.', 'medium', 'Malware & Ransomware', true),

-- Question 114
('What is ''Threat Intelligence''?',
'["A) Smart threats", "B) Information about current and emerging cyber threats to help organizations prepare", "C) IQ tests", "D) News articles"]',
1, 'Threat intelligence helps organizations proactively defend against known attack methods and actors.', 'medium', 'Data Protection & Privacy', true),

-- Question 115
('What is the risk of ''Over-Privileged'' accounts?',
'["A) Too many emails", "B) If compromised, attackers gain access to more systems and data than necessary", "C) Slower computers", "D) Higher costs"]',
1, 'Excessive privileges increase the potential damage from a compromised account.', 'medium', 'Insider Threats', true),

-- Question 116
('What is ''Secure Coding''?',
'["A) Writing code in a safe room", "B) Development practices that prevent security vulnerabilities in software", "C) Encrypted programming", "D) Fast coding"]',
1, 'Secure coding prevents common vulnerabilities like SQL injection and buffer overflows from being introduced.', 'medium', 'Data Protection & Privacy', true),

-- Question 117
('What is the purpose of ''Penetration Testing''?',
'["A) Testing pens", "B) Authorized simulated attacks to identify security vulnerabilities before real attackers do", "C) Network speed testing", "D) Software testing"]',
1, 'Penetration testing reveals weaknesses that can be fixed before malicious actors exploit them.', 'medium', 'Data Protection & Privacy', true),

-- Question 118
('What is ''Ransomware-as-a-Service'' (RaaS)?',
'["A) Ransomware insurance", "B) Criminal services that provide ransomware tools to other attackers for a share of profits", "C) Ransomware removal", "D) Data backup service"]',
1, 'RaaS has made ransomware attacks accessible to criminals without technical skills.', 'hard', 'Malware & Ransomware', true),

-- Question 119
('What is the risk of ''Third-Party'' vendors in cybersecurity?',
'["A) Higher costs", "B) Vendors with weak security can become entry points for attackers into your organization", "C) Slower service", "D) More paperwork"]',
1, 'Supply chain attacks often target less-secure vendors to gain access to their larger clients.', 'medium', 'Data Protection & Privacy', true),

-- Question 120
('What is ''Biometric Authentication''?',
'["A) Bio-technology", "B) Using unique physical characteristics (fingerprint, face, iris) to verify identity", "C) Biology tests", "D) Metric measurements"]',
1, 'Biometrics provide strong authentication as they are unique to each individual and difficult to forge.', 'easy', 'Password Security & Authentication', true),

-- Question 121
('What is a ''Sandbox'' in cybersecurity?',
'["A) A children''s play area", "B) An isolated environment for safely testing potentially malicious software", "C) A beach", "D) A storage container"]',
1, 'Sandboxes allow security teams to observe malware behavior without risking the actual network.', 'medium', 'Malware & Ransomware', true),

-- Question 122
('What is ''Certificate Pinning''?',
'["A) Attaching certificates to walls", "B) A security technique that associates a specific certificate with a service to prevent MITM attacks", "C) Printing certificates", "D) Collecting certificates"]',
1, 'Certificate pinning helps prevent attackers from using forged certificates to intercept communications.', 'hard', 'Data Protection & Privacy', true),

-- Question 123
('What is the danger of ''Screenshot'' malware?',
'["A) It makes pictures blurry", "B) It captures images of your screen to steal sensitive information", "C) It fills storage", "D) It slows down graphics"]',
1, 'Screenshot malware can capture sensitive data, passwords, and confidential documents displayed on screen.', 'medium', 'Malware & Ransomware', true),

-- Question 124
('What is ''Security by Obscurity'' and why is it insufficient?',
'["A) Hiding in dark rooms", "B) Relying on secrecy of design rather than robust security; insufficient because attackers eventually discover hidden methods", "C) Dark mode settings", "D) Privacy screens"]',
1, 'True security should withstand scrutiny, not depend on attackers not discovering the approach.', 'hard', 'Data Protection & Privacy', true),

-- Question 125
('What is a ''Backdoor'' in software?',
'["A) A rear entrance", "B) A hidden method for bypassing normal authentication to access a system", "C) A backup door", "D) An emergency exit"]',
1, 'Backdoors can be intentionally placed by developers or secretly installed by attackers for persistent access.', 'medium', 'Malware & Ransomware', true),

-- Question 126
('What is ''Geofencing'' in mobile security?',
'["A) Building fences", "B) Using GPS to create virtual boundaries that trigger security actions when crossed", "C) Geographic research", "D) Map making"]',
1, 'Geofencing can restrict access to corporate data when devices leave approved areas.', 'medium', 'Mobile Device Security', true),

-- Question 127
('What is the importance of ''Security Logging''?',
'["A) Chopping trees", "B) Recording system events to detect, investigate, and respond to security incidents", "C) Writing journals", "D) Creating reports"]',
1, 'Comprehensive logs are essential for forensic analysis and identifying how breaches occurred.', 'medium', 'Data Protection & Privacy', true),

-- Question 128
('What is ''SQL Injection''?',
'["A) Medical injection", "B) Inserting malicious SQL code into application queries to access or manipulate databases", "C) Database backup", "D) Query optimization"]',
1, 'SQL injection remains one of the most common and dangerous web application vulnerabilities.', 'hard', 'Malware & Ransomware', true),

-- Question 129
('What is ''Cross-Site Scripting'' (XSS)?',
'["A) Writing between sites", "B) Injecting malicious scripts into websites that execute in users'' browsers", "C) Website copying", "D) Domain transfer"]',
1, 'XSS attacks can steal session cookies, credentials, and perform actions on behalf of users.', 'hard', 'Phishing & Email Security', true),

-- Question 130
('What is the purpose of ''Web Application Firewall'' (WAF)?',
'["A) Blocking website access", "B) Filtering and monitoring HTTP traffic to protect web applications from attacks", "C) Creating websites", "D) Hosting websites"]',
1, 'WAFs protect against common web attacks like SQL injection and cross-site scripting.', 'medium', 'Data Protection & Privacy', true),

-- Question 131
('What is ''Credential Harvesting''?',
'["A) Farming credentials", "B) Collecting usernames and passwords through phishing sites or malware", "C) Password creation", "D) Account management"]',
1, 'Harvested credentials are sold on dark markets or used for further attacks.', 'medium', 'Phishing & Email Security', true),

-- Question 132
('What is a ''Pass-the-Hash'' attack?',
'["A) Sharing food", "B) Using stolen password hashes to authenticate without knowing the actual password", "C) Network routing", "D) Data transfer"]',
1, 'Pass-the-hash attacks bypass the need to crack passwords by using the hash directly.', 'hard', 'Password Security & Authentication', true),

-- Question 133
('What is ''Data Exfiltration''?',
'["A) Filtering data", "B) Unauthorized transfer of data out of an organization", "C) Data cleaning", "D) Data entry"]',
1, 'Data exfiltration is often the ultimate goal of breaches, whether for ransom or competitive advantage.', 'medium', 'Insider Threats', true),

-- Question 134
('What is the risk of ''Outdated Software''?',
'["A) It looks old", "B) Known vulnerabilities remain unpatched and can be exploited by attackers", "C) It''s slower", "D) It uses more storage"]',
1, 'Attackers actively scan for systems running outdated software with known vulnerabilities.', 'easy', 'Malware & Ransomware', true),

-- Question 135
('What is ''Security Posture''?',
'["A) Standing position", "B) An organization''s overall cybersecurity strength and readiness", "C) Camera angles", "D) Body language"]',
1, 'Security posture encompasses all security measures, policies, and controls in place.', 'medium', 'Data Protection & Privacy', true),

-- Question 136
('What is ''Threat Modeling''?',
'["A) Creating threat sculptures", "B) Identifying potential threats and vulnerabilities to prioritize security efforts", "C) Fashion modeling", "D) 3D printing"]',
1, 'Threat modeling helps organizations focus resources on the most likely and impactful threats.', 'hard', 'Data Protection & Privacy', true),

-- Question 137
('What is a ''Security Operations Center'' (SOC)?',
'["A) A military base", "B) A centralized team that monitors, detects, and responds to security incidents", "C) A data center", "D) A call center"]',
1, 'SOCs provide 24/7 monitoring and rapid response to security events.', 'medium', 'Data Protection & Privacy', true),

-- Question 138
('What is ''Lateral Movement'' in a cyberattack?',
'["A) Moving sideways", "B) Techniques attackers use to move through a network after initial access", "C) Dancing", "D) Network routing"]',
1, 'Lateral movement allows attackers to expand their access and reach valuable targets.', 'hard', 'Malware & Ransomware', true),

-- Question 139
('What is the purpose of ''Regular Security Audits''?',
'["A) To find mistakes", "B) To systematically evaluate security controls and identify weaknesses before attackers do", "C) Financial review", "D) Employee evaluation"]',
1, 'Regular audits ensure security measures remain effective as threats and systems evolve.', 'medium', 'Data Protection & Privacy', true),

-- Question 140
('What is ''Deepfake'' technology and its security risk?',
'["A) Deep sea exploration", "B) AI-generated fake video/audio that can impersonate real people for fraud", "C) Photography filters", "D) Video editing"]',
1, 'Deepfakes can be used for executive impersonation, misinformation, and bypassing voice/face verification.', 'medium', 'AI-Powered Threats', true),

-- Question 141
('What is ''Token Theft''?',
'["A) Stealing arcade tokens", "B) Stealing session tokens to hijack authenticated sessions without passwords", "C) Collecting souvenirs", "D) Cryptocurrency theft"]',
1, 'Stolen tokens allow attackers to bypass authentication entirely by reusing valid sessions.', 'hard', 'Password Security & Authentication', true),

-- Question 142
('What is the importance of ''Separation of Duties''?',
'["A) Different job titles", "B) Dividing critical tasks among multiple people to prevent fraud and errors", "C) Department divisions", "D) Office layout"]',
1, 'Separation of duties ensures no single person can complete a critical process alone, reducing insider risk.', 'medium', 'Insider Threats', true),

-- Question 143
('What is ''Browser Isolation''?',
'["A) Using browsers alone", "B) Running web browsing in an isolated environment to protect against web-based threats", "C) Deleting browsers", "D) Blocking websites"]',
1, 'Browser isolation contains malicious code from web pages, preventing it from reaching the endpoint.', 'hard', 'Data Protection & Privacy', true),

-- Question 144
('What is a ''Watering Hole'' attack?',
'["A) Attacking water supplies", "B) Compromising websites that specific target groups frequently visit", "C) Pool maintenance", "D) Water filtration"]',
1, 'Attackers research their targets'' web habits and infect sites they know will be visited.', 'hard', 'Social Engineering & Pretexting', true),

-- Question 145
('What is ''Change Management'' in security?',
'["A) Organizational restructuring", "B) A formal process for reviewing, approving, and documenting system changes to prevent security issues", "C) Career changes", "D) Currency exchange"]',
1, 'Proper change management prevents unauthorized or untested changes from introducing vulnerabilities.', 'medium', 'Data Protection & Privacy', true),

-- Question 146
('What is a ''Replay Attack''?',
'["A) Watching videos again", "B) Intercepting and retransmitting valid data to trick a system into unauthorized actions", "C) Music playback", "D) Sports highlights"]',
1, 'Replay attacks can bypass authentication by reusing captured legitimate communications.', 'hard', 'Password Security & Authentication', true),

-- Question 147
('What is ''Typosquatting''?',
'["A) Correct typing practice", "B) Registering misspelled versions of popular domain names to catch typing errors", "C) Keyboard layouts", "D) Auto-correct"]',
1, 'Typosquatting sites often host phishing pages or malware that unsuspecting visitors encounter.', 'medium', 'Phishing & Email Security', true),

-- Question 148
('What is ''Kill Chain'' in cybersecurity?',
'["A) A video game term", "B) A model describing the stages of a cyberattack from reconnaissance to objective", "C) Supply chain", "D) Manufacturing process"]',
1, 'Understanding the kill chain helps defenders interrupt attacks at various stages.', 'hard', 'Data Protection & Privacy', true),

-- Question 149
('What is ''Mobile Device Management'' (MDM)?',
'["A) Phone repair", "B) Software for managing, securing, and enforcing policies on mobile devices in an organization", "C) App stores", "D) Phone plans"]',
1, 'MDM allows organizations to remotely manage, secure, and wipe lost or stolen devices.', 'medium', 'Mobile Device Security', true),

-- Question 150
('What is a ''Zero Trust'' security model?',
'["A) Trusting no one socially", "B) A security approach that requires verification for everyone trying to access resources, inside or outside the network", "C) No security at all", "D) Free access for everyone"]',
1, 'Zero Trust assumes breach and verifies every access request as if it originated from an untrusted network.', 'medium', 'Data Protection & Privacy', true),

-- Question 151
('What is ''Email Spoofing''?',
'["A) Deleting emails", "B) Forging the sender address to make an email appear to come from someone else", "C) Email filtering", "D) Email forwarding"]',
1, 'Spoofed emails can appear to come from trusted sources like executives or vendors.', 'easy', 'Phishing & Email Security', true),

-- Question 152
('What is ''Remote Access Trojan'' (RAT)?',
'["A) A rodent problem", "B) Malware that gives attackers complete remote control over an infected system", "C) Remote desktop software", "D) A video conferencing tool"]',
1, 'RATs allow attackers to control systems, steal data, and spy on users remotely.', 'medium', 'Malware & Ransomware', true),

-- Question 153
('What is the danger of ''Free VPN'' services?',
'["A) They''re too slow", "B) Many log and sell your data or inject ads, defeating the purpose of privacy", "C) They don''t work", "D) They use too much battery"]',
1, 'Free VPNs often monetize by selling user data or showing targeted ads, compromising privacy.', 'medium', 'Remote Work Security', true),

-- Question 154
('What is ''API Security''?',
'["A) Bee security", "B) Protecting application programming interfaces from unauthorized access and attacks", "C) Apple products", "D) Airport security"]',
1, 'APIs are increasingly targeted as they often provide direct access to sensitive data and functions.', 'hard', 'Data Protection & Privacy', true),

-- Question 155
('What is a ''Dictionary Attack''?',
'["A) Attacking dictionaries", "B) Using a list of common words and passwords to attempt to crack credentials", "C) Learning new words", "D) Spell checking"]',
1, 'Dictionary attacks exploit users who choose common or predictable passwords.', 'medium', 'Password Security & Authentication', true),

-- Question 156
('What is ''Physical Access Control''?',
'["A) Exercise control", "B) Security measures like badges, locks, and guards to restrict who can enter facilities", "C) Remote access", "D) Cloud storage"]',
1, 'Physical access control is the first line of defense against unauthorized entry and device theft.', 'easy', 'Physical Security & Clean Desk', true),

-- Question 157
('What is ''Security Token Service'' (STS)?',
'["A) Train station security", "B) A service that issues security tokens for authentication in federated identity systems", "C) Stock trading", "D) Transit security"]',
1, 'STS enables single sign-on and secure token exchange between different systems and organizations.', 'hard', 'Password Security & Authentication', true),

-- Question 158
('What is the risk of ''Auto-Fill'' for passwords in browsers?',
'["A) It makes typing faster", "B) Malicious websites can trick browsers into filling passwords on hidden forms", "C) It uses memory", "D) Nothing"]',
1, 'Auto-fill can be exploited to steal credentials through invisible form fields on malicious pages.', 'medium', 'Password Security & Authentication', true),

-- Question 159
('What is ''Vulnerability Assessment''?',
'["A) Personality testing", "B) Systematic process of identifying and evaluating security weaknesses in systems", "C) Performance review", "D) Health checkup"]',
1, 'Regular vulnerability assessments help organizations discover and fix weaknesses before attackers exploit them.', 'medium', 'Data Protection & Privacy', true),

-- Question 160
('What is ''Security Information and Event Management'' (SIEM)?',
'["A) Seminar management", "B) Technology that collects and analyzes security data from across the network for threat detection", "C) Information systems", "D) Event planning"]',
1, 'SIEM platforms aggregate logs and alerts, enabling security teams to detect patterns and respond to threats.', 'hard', 'Data Protection & Privacy', true),

-- Question 161
('What is a ''Rogue Access Point''?',
'["A) A rebel employee", "B) An unauthorized Wi-Fi access point that can intercept network traffic", "C) A broken router", "D) A remote office"]',
1, 'Rogue access points can be set up by attackers to capture sensitive data from unsuspecting users.', 'medium', 'Mobile Device Security', true),

-- Question 162
('What is ''Wiper'' malware?',
'["A) Cleaning software", "B) Malware designed to permanently destroy data rather than hold it for ransom", "C) Disk cleanup", "D) Antivirus"]',
1, 'Wiper malware aims for destruction, often used in politically motivated attacks.', 'hard', 'Malware & Ransomware', true),

-- Question 163
('What is the importance of ''Regular Password Changes''?',
'["A) To remember new passwords", "B) Limits the window of opportunity if a password is compromised without detection", "C) To follow tradition", "D) To reset brain memory"]',
1, 'Regular changes reduce the time attackers can use stolen credentials, though overly frequent changes can lead to weaker passwords.', 'medium', 'Password Security & Authentication', true),

-- Question 164
('What is ''Attack Surface''?',
'["A) A war zone", "B) All the points where an attacker could try to enter or extract data from a system", "C) A gaming map", "D) Office floor plan"]',
1, 'Reducing the attack surface by minimizing exposed services and access points improves security.', 'medium', 'Data Protection & Privacy', true),

-- Question 165
('What is ''Single Sign-On'' (SSO) and its security consideration?',
'["A) Signing one document", "B) One login for multiple services; convenient but means one compromised credential grants access to all", "C) Solo work", "D) One-time passwords"]',
1, 'SSO improves user experience but requires strong protection of that single credential.', 'medium', 'Password Security & Authentication', true),

-- Question 166
('What is ''Ransomware Double Extortion''?',
'["A) Paying twice", "B) Encrypting data AND threatening to leak it publicly if ransom isn''t paid", "C) Two ransoms", "D) Duplicate encryption"]',
1, 'Double extortion increases pressure on victims who might have backups but fear data exposure.', 'hard', 'Malware & Ransomware', true),

-- Question 167
('What is the security risk of ''Cloud Misconfiguration''?',
'["A) Slow cloud services", "B) Improper settings can expose data publicly or allow unauthorized access", "C) Higher cloud costs", "D) Cloud downtime"]',
1, 'Misconfigured cloud storage has led to numerous major data breaches exposing millions of records.', 'medium', 'Data Protection & Privacy', true),

-- Question 168
('What is ''Smishing''?',
'["A) Fishing while smiling", "B) Phishing attacks conducted via SMS text messages", "C) Social media phishing", "D) Smart phishing"]',
1, 'Smishing uses the same manipulation techniques as email phishing but via text messages.', 'easy', 'Mobile Device Security', true),

-- Question 169
('What is the purpose of ''Data Classification''?',
'["A) Sorting files alphabetically", "B) Categorizing data by sensitivity to apply appropriate security controls", "C) File organization", "D) Database indexing"]',
1, 'Classification ensures the most sensitive data receives the strongest protection.', 'medium', 'Data Protection & Privacy', true),

-- Question 170
('What is ''Business Continuity Planning'' (BCP)?',
'["A) Business expansion plans", "B) Strategies to ensure critical business functions can continue during and after a disaster", "C) Marketing plans", "D) Hiring plans"]',
1, 'BCP includes preparation for cyber incidents, ensuring organizations can maintain or quickly resume operations.', 'medium', 'Data Protection & Privacy', true),

-- Question 171
('What is a ''Rubber Ducky'' attack?',
'["A) Bath toy hacking", "B) Using a USB device that appears as a keyboard to rapidly type malicious commands", "C) Duck hunting", "D) Water damage"]',
1, 'Rubber Ducky devices can execute pre-programmed attacks in seconds when plugged in.', 'hard', 'Physical Security & Clean Desk', true),

-- Question 172
('What is ''Threat Hunting''?',
'["A) Animal tracking", "B) Proactively searching for hidden threats that have evaded existing security controls", "C) Job hunting", "D) Treasure hunting"]',
1, 'Threat hunting assumes that attackers may already be inside the network and actively searches for signs of compromise.', 'hard', 'Data Protection & Privacy', true),

-- Question 173
('What is the risk of ''Screenshot Sharing'' in business communications?',
'["A) Large file sizes", "B) May inadvertently expose sensitive information visible on screen", "C) Poor image quality", "D) Copyright issues"]',
1, 'Screenshots can accidentally capture tabs, notifications, or data not intended for sharing.', 'easy', 'Data Protection & Privacy', true),

-- Question 174
('What is ''Steganography''?',
'["A) A type of dinosaur", "B) Hiding data within other files like images or audio to avoid detection", "C) Handwriting analysis", "D) Stone carving"]',
1, 'Steganography can be used to exfiltrate data or deliver malware while evading security detection.', 'hard', 'Malware & Ransomware', true),

-- Question 175
('What is ''IoT Security'' and why is it important?',
'["A) Internet of Things protection; important because many IoT devices have weak security and can be entry points", "B) Protecting websites", "C) Mobile security", "D) Cloud security"]',
1, 'IoT devices often lack proper security updates and can be compromised to access networks or join botnets.', 'medium', 'Mobile Device Security', true),

-- Question 176
('What is a ''Man-in-the-Browser'' attack?',
'["A) Someone looking at your browser", "B) Malware that intercepts and modifies web transactions within the browser", "C) Browser extension", "D) Pop-up ads"]',
1, 'This attack can modify banking transactions in real-time before they are sent to the server.', 'hard', 'Malware & Ransomware', true),

-- Question 177
('What is ''Security Orchestration''?',
'["A) Musical security", "B) Automating and coordinating security tools and processes for faster incident response", "C) Organized security guards", "D) Security scheduling"]',
1, 'Orchestration reduces response time by automating routine security tasks and connecting different tools.', 'hard', 'Data Protection & Privacy', true),

-- Question 178
('What is the risk of ''Reusing Security Questions''?',
'["A) Boring questions", "B) Answers found on social media can be used across multiple accounts", "C) Forgetting answers", "D) Question limits"]',
1, 'Security question answers are often discoverable through social media or data breaches.', 'medium', 'Password Security & Authentication', true),

-- Question 179
('What is ''Formjacking''?',
'["A) Filling out forms", "B) Injecting malicious code into payment forms to steal credit card information", "C) Form design", "D) Document scanning"]',
1, 'Formjacking skims payment data directly from legitimate e-commerce checkout pages.', 'hard', 'Phishing & Email Security', true),

-- Question 180
('What is ''Account Takeover'' (ATO)?',
'["A) Closing accounts", "B) Attackers gaining control of legitimate user accounts through stolen credentials or other means", "C) Account creation", "D) Account sharing"]',
1, 'ATO allows attackers to act as legitimate users, making detection difficult.', 'medium', 'Password Security & Authentication', true),

-- Question 181
('What is the importance of ''Exit Interviews'' for security?',
'["A) HR formality", "B) Opportunity to revoke access, recover assets, and address any security concerns", "C) Goodbye party", "D) Reference check"]',
1, 'Proper offboarding prevents former employees from retaining unauthorized access.', 'medium', 'Insider Threats', true),

-- Question 182
('What is ''DNS over HTTPS'' (DoH)?',
'["A) Faster DNS", "B) Encrypting DNS queries to prevent eavesdropping and manipulation", "C) New domain names", "D) Website hosting"]',
1, 'DoH improves privacy but can also be used by malware to evade DNS-based security controls.', 'hard', 'Data Protection & Privacy', true),

-- Question 183
('What is a ''Watering Hole'' attack?',
'["A) Pool party attack", "B) Compromising websites frequently visited by target groups to infect their devices", "C) Water system hack", "D) Fishing attack"]',
1, 'Attackers research their targets'' browsing habits and compromise sites they frequently visit.', 'hard', 'Social Engineering & Pretexting', true),

-- Question 184
('What is ''Social Proof'' manipulation in scams?',
'["A) Sociology research", "B) Using fake reviews, testimonials, or follower counts to create false trust", "C) Scientific proof", "D) Legal evidence"]',
1, 'Scammers exploit the tendency to trust what appears popular or well-reviewed.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 185
('What is the security risk of ''Smart Speakers'' in offices?',
'["A) They play music too loud", "B) Always-listening devices could capture confidential conversations", "C) High electricity use", "D) Poor sound quality"]',
1, 'Smart devices with microphones present potential eavesdropping and data privacy risks.', 'medium', 'Physical Security & Clean Desk', true),

-- Question 186
('What is ''Reverse Engineering'' in security?',
'["A) Building things backwards", "B) Analyzing malware or software to understand how it works and find vulnerabilities", "C) Recycling", "D) Quality control"]',
1, 'Reverse engineering helps defenders understand threats and also helps find bugs in software.', 'hard', 'Malware & Ransomware', true),

-- Question 187
('What is ''Security Hygiene''?',
'["A) Cleaning computers", "B) Basic security practices like updates, strong passwords, and awareness", "C) Hand washing", "D) Office cleaning"]',
1, 'Good security hygiene prevents most common attacks through basic preventive measures.', 'easy', 'Data Protection & Privacy', true),

-- Question 188
('What is the risk of ''Cached Credentials''?',
'["A) Slow login", "B) Stored credentials can be extracted by attackers with system access", "C) Memory usage", "D) Nothing"]',
1, 'Attackers who gain system access can dump cached credentials to escalate privileges or move laterally.', 'hard', 'Password Security & Authentication', true),

-- Question 189
('What is ''Quishing''?',
'["A) Quiet phishing", "B) Phishing attacks using QR codes to direct victims to malicious sites", "C) Quick phishing", "D) Quiz phishing"]',
1, 'QR codes bypass text-based email filters and take advantage of mobile devices'' weaker security.', 'medium', 'Phishing & Email Security', true),

-- Question 190
('What is ''Security Fatigue''?',
'["A) Being tired of security", "B) When users become desensitized to security warnings and start ignoring or bypassing controls", "C) Physical exhaustion", "D) Alarm fatigue"]',
1, 'Security fatigue leads to risky behaviors like using weak passwords or clicking through warnings.', 'medium', 'Social Engineering & Pretexting', true),

-- Question 191
('What is the purpose of ''Red Team'' exercises?',
'["A) Sports competition", "B) Simulating real-world attacks to test an organization''s defenses and response", "C) Interior design", "D) Political activities"]',
1, 'Red team exercises provide realistic assessment of security posture against determined attackers.', 'hard', 'Data Protection & Privacy', true),

-- Question 192
('What is ''Compliance'' in cybersecurity?',
'["A) Being agreeable", "B) Meeting legal, regulatory, and industry security standards and requirements", "C) Following orders", "D) Company rules"]',
1, 'Compliance ensures organizations meet minimum security standards required by law or industry.', 'easy', 'Data Protection & Privacy', true),

-- Question 193
('What is a ''Security Champion''?',
'["A) Winner of security contest", "B) An employee who promotes security awareness and best practices within their team", "C) Security guard leader", "D) Top hacker"]',
1, 'Security champions help spread security culture throughout an organization.', 'easy', 'Social Engineering & Pretexting', true),

-- Question 194
('What is ''Living off the Land'' (LotL) in cyberattacks?',
'["A) Farming", "B) Using legitimate system tools already present to conduct attacks, avoiding detection", "C) Camping", "D) Survival skills"]',
1, 'LotL attacks are hard to detect because they use trusted tools like PowerShell rather than malware.', 'hard', 'Malware & Ransomware', true),

-- Question 195
('What is the risk of ''Shadow IT''?',
'["A) Working in the dark", "B) Unauthorized systems and apps used without IT approval create unmanaged security risks", "C) IT ghost stories", "D) Night shift IT"]',
1, 'Shadow IT bypasses security controls and creates blind spots for security teams.', 'medium', 'Insider Threats', true),

-- Question 196
('What is ''Adversary Emulation''?',
'["A) Copying enemies", "B) Mimicking specific threat actors'' tactics to test defenses against known threats", "C) War games", "D) Acting classes"]',
1, 'Adversary emulation tests defenses against the specific techniques used by relevant threat actors.', 'hard', 'Data Protection & Privacy', true),

-- Question 197
('What is the security concern with ''Clipboard Hijacking''?',
'["A) Stealing clipboards", "B) Malware that replaces copied cryptocurrency addresses or data with attacker-controlled values", "C) Note taking", "D) Copy-paste issues"]',
1, 'Clipboard hijacking has resulted in significant cryptocurrency theft by swapping wallet addresses.', 'hard', 'Malware & Ransomware', true),

-- Question 198
('What is ''Privilege Creep''?',
'["A) Scary privileges", "B) Gradual accumulation of access rights beyond what is needed, often from role changes", "C) Slow promotions", "D) Stealthy permissions"]',
1, 'Privilege creep violates least privilege and increases risk if the account is compromised.', 'medium', 'Insider Threats', true),

-- Question 199
('What is the importance of ''Security Metrics''?',
'["A) Measuring security guards", "B) Quantitative data to measure security program effectiveness and guide improvements", "C) Metric system", "D) Performance reviews"]',
1, 'Metrics help demonstrate security program value and identify areas needing improvement.', 'medium', 'Data Protection & Privacy', true),

-- Question 200
('What is ''Brand Impersonation''?',
'["A) Company mascots", "B) Attackers creating fake websites, emails, or profiles mimicking trusted brands to deceive victims", "C) Logo design", "D) Marketing"]',
1, 'Brand impersonation exploits consumer trust in well-known companies to conduct phishing and fraud.', 'medium', 'Phishing & Email Security', true);

-- Verify count
SELECT COUNT(*) as total_questions FROM quiz_questions;
