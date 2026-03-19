const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Generate a PDF bio based on the StrategyBRIX standard.
 * @param {Object} data - Biographic data (bio, user, projects, expertise)
 * @returns {Promise<Buffer>} - Generated PDF buffer
 */
const generateBioPdf = async (data) => {
  const { user, bio } = data;
  
  // Format the name + credentials for the header
  const titleLine = `${user.name}${bio.credentials ? `, ${bio.credentials}` : ''}`;
  const jobLine = `${bio.job_title} | StrategyBRIX`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; background: #fff; color: #1a1a1a; }
        .header { display: flex; align-items: flex-start; gap: 40px; margin-bottom: 40px; }
        .photo-container { width: 120px; height: 120px; border-radius: 50%; overflow: hidden; background: #f0f0f0; border: 2px solid #7c3aed; box-shadow: 0 4px 10px rgba(0,0,0,0.1); flex-shrink: 0; }
        .photo-container img { width: 100%; height: 100%; object-fit: cover; }
        .user-info h1 { margin: 0; font-size: 32px; color: #000; font-weight: 800; }
        .user-info .title { font-size: 20px; color: #4b5563; margin-top: 4px; font-weight: 600; }
        
        .main-content { display: grid; grid-template-cols: 2fr 1fr; gap: 40px; }
        
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: 700; color: #7c3aed; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        
        .bio-text { line-height: 1.6; color: #4b5563; }
        
        .projects { margin-top: 10px; }
        .project-item { margin-bottom: 15px; }
        .project-heading { font-weight: 700; color: #111827; }
        .project-text { margin-left: 0px; color: #4b5563; }
        
        .expertise-list { list-style: none; padding: 0; }
        .expertise-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
        .expertise-item:last-child { border-bottom: none; }
        
        .footer { position: fixed; bottom: 40px; left: 40px; right: 40px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 10px; display: flex; justify-content: space-between; }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    </head>
    <body>
      <div class="header">
        <div class="photo-container">
          <img src="${bio.photo_url || 'https://via.placeholder.com/150'}" alt="${user.name}">
        </div>
        <div class="user-info">
          <h1>${user.name}</h1>
          <div class="title">${titleLine}</div>
          <p style="color: #7c3aed; font-weight: 600; margin-top: 10px;">${jobLine}</p>
        </div>
      </div>
      
      <div class="main-content">
        <div class="left-col">
          <div class="section">
            <div class="section-title">Professional Background</div>
            <div class="bio-text">${bio.bio_text}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Relevant Project Experience</div>
            <div class="projects">
              ${(bio.projects || []).map(p => `
                <div class="project-item">
                  <span class="project-heading">${p.category} | ${p.client_type}:</span>
                  <div class="project-text">${p.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="right-col">
          <div class="section">
            <div class="section-title">Areas of Expertise</div>
            <ul class="expertise-list">
              ${(bio.expertise || []).map(e => `
                <li class="expertise-item">${e}</li>
              `).join('')}
            </ul>
          </div>
          
          <div class="section">
            <div class="section-title">Credentials</div>
            <div class="bio-text">${bio.credentials || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <span>StrategyBRIX Confidential</span>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdfData = await page.pdf({
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true
  });

  // Ensure it's a proper Node.js Buffer (Puppeteer may return Uint8Array)
  const pdfBuffer = Buffer.from(pdfData);

  await browser.close();
  return pdfBuffer;
};

module.exports = {
  generateBioPdf,
};
