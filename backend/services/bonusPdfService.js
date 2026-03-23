const puppeteer = require('puppeteer');
const { fmt, fmtUsd, fmtPct, fmtDate, RATING_WEIGHTS } = require('./bonusCalculations');

async function generateBonusPdf({ config, computed, guidanceRanges }) {
  const { rows, totals, bonusAllocation, milestoneData, milestonePool, perfAllocation, tenureAllocation, budgetPct, adjustment, perfWeight, tenureWeight } = computed;
  const activeRows = rows.filter(r => r.is_active);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const programName = config.program_name || 'Bonus Program';
  const year = config.year || new Date().getFullYear();

  const mainTableRows = activeRows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#111827' : '#0F172A'}">
      <td class="c-emp">${r.resource_name || '-'}</td>
      <td class="c-emp">${r.title || '-'}</td>
      <td class="c-emp al-c">${fmtDate(r.join_date)}</td>
      <td class="c-emp al-r">${r.tenure.toFixed(1)}</td>
      <td class="c-boy al-r">${fmt(r.totalCompLcy)}</td>
      <td class="c-boy al-c">${r.currency}</td>
      <td class="c-boy al-r">${fmtUsd(r.totalCompUsd)}</td>
      <td class="c-boy al-r">${fmt(r.salaryLcy)}</td>
      <td class="c-boy al-r">${fmtUsd(r.salaryUsd)}</td>
      <td class="c-boy al-r">${fmtPct(r.bonusPct, 2)}</td>
      <td class="c-boy al-r">${fmt(r.bonusLcy)}</td>
      <td class="c-boy al-r">${fmtUsd(r.bonusUsd)}</td>
      <td class="c-boy al-r">${fmt(r.signOnLcy)}</td>
      <td class="c-boy al-r">${fmtUsd(r.signOnUsd)}</td>
      <td class="c-mid al-c">${r.eligible ? 'Y' : 'N'}</td>
      <td class="c-mid al-r">${fmt(r.spotLcy)}</td>
      <td class="c-mid al-r">${fmtUsd(r.spotUsd)}</td>
      <td class="c-pool al-c">${r.rating != null ? parseFloat(r.rating).toFixed(2) : '-'}</td>
      <td class="c-pool al-c">${r.targetRange || '-'}</td>
      <td class="c-pool al-r">${fmtPct(r.perfContribPct)}</td>
      <td class="c-pool al-r">${fmtUsd(r.initialPerfPortion)}</td>
      <td class="c-pool al-r">${fmtUsd(r.adjustedPerfPortion)}</td>
      <td class="c-pool al-r">${fmtPct(r.tenureContribPct)}</td>
      <td class="c-pool al-r">${fmtUsd(r.tenurePortion)}</td>
      <td class="c-pool al-r">${fmtUsd(r.initialPoolUsd)}</td>
      <td class="c-pool al-r" ${r.capped ? 'style="color:#f87171"' : ''}>${fmtUsd(r.finalPoolUsd)}${r.capped ? '*' : ''}</td>
      <td class="c-pool al-r" ${r.capped ? 'style="color:#f87171"' : ''}>${fmt(r.finalPoolLcy)}</td>
      <td class="c-pool al-r" ${r.salaryLcy > 0 && r.finalPoolLcy / r.salaryLcy > 0.05 ? 'style="color:#f87171"' : ''}>${r.salaryLcy > 0 ? fmtPct(r.finalPoolLcy / r.salaryLcy) : '-'}</td>
      <td class="c-eoy al-r">${fmt(r.eoyCompLcy)}</td>
      <td class="c-eoy al-r">${fmtUsd(r.eoyCompUsd)}</td>
      <td class="c-eoy al-r">${fmtPct(r.eoyBonusPct)}</td>
    </tr>
  `).join('');

  const milestoneRows = milestoneData.map(m => {
    const isActive = m.sequence === config.active_milestone_sequence;
    return `
      <tr style="${isActive ? 'background:rgba(124,58,237,0.15);color:#fff;font-weight:600' : ''}">
        <td class="sc">${m.sequence}</td>
        <td class="sc al-r">${fmtUsd(parseInt(m.target_revenue))}</td>
        <td class="sc al-r">${fmtPct(parseFloat(m.profit_share_pct), 0)}</td>
        <td class="sc al-r">${fmtUsd(Math.round(m.profitSharePool))}</td>
      </tr>
    `;
  }).join('');

  const guidanceRows = guidanceRanges.map(g => `
    <tr>
      <td class="sc">${g.rating}</td>
      <td class="sc">${g.target_range}</td>
      <td class="sc al-r">${fmtPct(parseFloat(g.milestone2_pct) || 0)}</td>
      <td class="sc al-r">${fmtPct(parseFloat(g.milestone3_pct) || 0)}</td>
      <td class="sc al-r">${fmtPct(parseFloat(g.milestone4_pct) || 0)}</td>
    </tr>
  `).join('');

  const ratingRows = [1,2,3,4,5].map(r => `
    <tr>
      <td class="sc">${r}</td>
      <td class="sc al-r">${RATING_WEIGHTS[r]}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#0F172A; color:#e5e7eb; -webkit-print-color-adjust:exact; }

  /* Page 1 */
  .page { padding:32px 28px; page-break-after:always; }
  .page:last-child { page-break-after:auto; }

  /* Header */
  .header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #7C3AED; }
  .header-left h1 { font-size:18px; font-weight:700; color:#fff; letter-spacing:-0.3px; }
  .header-left .sub { font-size:10px; color:#9ca3af; margin-top:2px; }
  .header-right { text-align:right; font-size:9px; color:#9ca3af; }
  .header-right .conf { color:#7C3AED; font-weight:600; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; }
  .logo { font-size:14px; font-weight:700; color:#fff; }
  .logo span { color:#7C3AED; }

  /* Main table */
  table.main { width:100%; border-collapse:collapse; font-size:7px; line-height:1.3; }
  table.main thead { display:table-header-group; }
  table.main th { padding:5px 4px; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; font-size:6px; border-bottom:1px solid rgba(255,255,255,0.1); }
  table.main td { padding:4px 4px; border-bottom:1px solid rgba(255,255,255,0.04); }

  /* Section header colors */
  .sh-emp { background:rgba(255,255,255,0.06); color:#d1d5db; }
  .sh-boy { background:rgba(32,156,233,0.15); color:#209CE9; }
  .sh-mid { background:rgba(251,221,17,0.12); color:#FBDD11; }
  .sh-pool { background:rgba(124,58,237,0.15); color:#7C3AED; }
  .sh-eoy { background:rgba(239,68,68,0.12); color:#f87171; }

  /* Column header colors */
  .ch-emp { background:rgba(255,255,255,0.04); color:#9ca3af; }
  .ch-boy { background:rgba(32,156,233,0.06); color:#7dd3fc; }
  .ch-mid { background:rgba(251,221,17,0.05); color:#fde68a; }
  .ch-pool { background:rgba(124,58,237,0.06); color:#c4b5fd; }
  .ch-eoy { background:rgba(239,68,68,0.05); color:#fca5a5; }

  /* Cell base colors */
  .c-emp { color:#e5e7eb; }
  .c-boy { color:#cbd5e1; }
  .c-mid { color:#cbd5e1; }
  .c-pool { color:#cbd5e1; }
  .c-eoy { color:#cbd5e1; }

  .al-r { text-align:right; }
  .al-c { text-align:center; }
  .al-l { text-align:left; }

  /* Totals */
  .totals-row td { background:#1E293B !important; color:#fff; font-weight:600; padding:5px 4px; border-top:2px solid rgba(124,58,237,0.4); }

  /* Footer note */
  .footnote { font-size:7px; color:#6b7280; margin-top:8px; padding:4px 0; }

  /* Page 2: supporting blocks */
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:16px; }
  .card h3 { font-size:11px; font-weight:600; color:#fff; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid; }
  .card h3.purple { border-color:#7C3AED; }
  .card h3.blue { border-color:#209CE9; }
  .card h3.green { border-color:#4CBF4B; }
  .card h3.yellow { border-color:#FBDD11; }

  table.sub { width:100%; border-collapse:collapse; font-size:9px; }
  table.sub th { padding:6px 8px; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; font-size:7px; color:#9ca3af; background:rgba(255,255,255,0.04); text-align:left; }
  table.sub th.al-r { text-align:right; }
  .sc { padding:5px 8px; border-top:1px solid rgba(255,255,255,0.05); color:#d1d5db; }

  /* Summary items */
  .summary-row { display:flex; justify-content:space-between; padding:5px 0; font-size:10px; color:#d1d5db; }
  .summary-row .val { font-weight:600; color:#fff; }
  .summary-row .green { color:#4ade80; }
  .summary-row .red { color:#f87171; }
  .summary-divider { border-top:1px solid rgba(255,255,255,0.1); margin:4px 0; }

  /* Page footer */
  .page-footer { position:fixed; bottom:0; left:0; right:0; padding:8px 28px; font-size:7px; color:#6b7280; display:flex; justify-content:space-between; background:#0F172A; }
</style>
</head><body>

<!-- PAGE 1: Main Compensation Table -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo">Strategy<span>BRIX</span></div>
      <h1>${programName} ${year}</h1>
      <div class="sub">Compensation Data & Bonus Pool Analysis</div>
    </div>
    <div class="header-right">
      <div class="conf">CONFIDENTIAL</div>
      <div>Generated: ${date}</div>
      <div>Active Milestone: ${config.active_milestone_sequence} | Pool: ${fmtUsd(milestonePool)}</div>
    </div>
  </div>

  <table class="main">
    <thead>
      <tr>
        <th colspan="4" class="sh-emp al-c">Employee</th>
        <th colspan="10" class="sh-boy al-c">Beginning of Year Compensation</th>
        <th colspan="3" class="sh-mid al-c">Midyear / Spot</th>
        <th colspan="11" class="sh-pool al-c">Pickup Bonus Pool</th>
        <th colspan="3" class="sh-eoy al-c">End of Year Comp</th>
      </tr>
      <tr>
        <th class="ch-emp al-l">Resource</th>
        <th class="ch-emp al-l">Title</th>
        <th class="ch-emp al-c">Join Date</th>
        <th class="ch-emp al-r">Tenure</th>
        <th class="ch-boy al-r">Comp (LCY)</th>
        <th class="ch-boy al-c">LCY</th>
        <th class="ch-boy al-r">Comp (USD)</th>
        <th class="ch-boy al-r">Sal (LCY)</th>
        <th class="ch-boy al-r">Sal (USD)</th>
        <th class="ch-boy al-r">Bonus %</th>
        <th class="ch-boy al-r">Bonus (LCY)</th>
        <th class="ch-boy al-r">Bonus (USD)</th>
        <th class="ch-boy al-r">Sign-on (LCY)</th>
        <th class="ch-boy al-r">Sign-on (USD)</th>
        <th class="ch-mid al-c">Elig</th>
        <th class="ch-mid al-r">Spot (LCY)</th>
        <th class="ch-mid al-r">Spot (USD)</th>
        <th class="ch-pool al-c">Rating</th>
        <th class="ch-pool al-c">Range</th>
        <th class="ch-pool al-r">Perf %</th>
        <th class="ch-pool al-r">Init Perf</th>
        <th class="ch-pool al-r">Adj Perf</th>
        <th class="ch-pool al-r">Tenure %</th>
        <th class="ch-pool al-r">Tenure $</th>
        <th class="ch-pool al-r">Init Pool</th>
        <th class="ch-pool al-r">Final Pool</th>
        <th class="ch-pool al-r">Pool (LCY)</th>
        <th class="ch-pool al-r">% Sal</th>
        <th class="ch-eoy al-r">Comp (LCY)</th>
        <th class="ch-eoy al-r">Comp (USD)</th>
        <th class="ch-eoy al-r">Bonus %</th>
      </tr>
    </thead>
    <tbody>
      ${mainTableRows}
      <tr class="totals-row">
        <td colspan="2" style="font-weight:700">Totals</td>
        <td></td>
        <td></td>
        <td class="al-r">${fmt(totals.totalCompLcy)}</td>
        <td></td>
        <td class="al-r">${fmtUsd(totals.totalCompUsd)}</td>
        <td class="al-r">${fmt(totals.salaryLcy)}</td>
        <td class="al-r">${fmtUsd(totals.salaryUsd)}</td>
        <td></td>
        <td class="al-r">${fmt(totals.bonusLcy)}</td>
        <td class="al-r">${fmtUsd(totals.bonusUsd)}</td>
        <td class="al-r">${fmt(totals.signOnLcy)}</td>
        <td class="al-r">${fmtUsd(totals.signOnUsd)}</td>
        <td></td>
        <td class="al-r">${fmt(totals.spotLcy)}</td>
        <td class="al-r">${fmtUsd(totals.spotUsd)}</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="al-r">${fmtUsd(totals.initialPerfPortion)}</td>
        <td class="al-r">${fmtUsd(totals.adjustedPerfPortion)}</td>
        <td></td>
        <td class="al-r">${fmtUsd(totals.tenurePortion)}</td>
        <td class="al-r">${fmtUsd(totals.initialPoolUsd)}</td>
        <td class="al-r">${fmtUsd(totals.finalPoolUsd)}</td>
        <td class="al-r">${fmt(totals.finalPoolLcy)}</td>
        <td></td>
        <td class="al-r">${fmt(totals.eoyCompLcy)}</td>
        <td class="al-r">${fmtUsd(totals.eoyCompUsd)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footnote">*Excludes contractors and ineligible employees from pool calculations</div>
</div>

<!-- PAGE 2: Supporting Tables -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo">Strategy<span>BRIX</span></div>
      <h1>${programName} ${year} — Supporting Details</h1>
      <div class="sub">Allocation, Milestones & Guidance Configuration</div>
    </div>
    <div class="header-right">
      <div class="conf">CONFIDENTIAL</div>
      <div>Generated: ${date}</div>
    </div>
  </div>

  <div class="grid-2">
    <!-- Milestones -->
    <div class="card">
      <h3 class="purple">Bonus Allocation & Milestones</h3>
      <div style="font-size:10px;color:#d1d5db;margin-bottom:10px">
        Bonus Allocation: <strong style="color:#fff">${fmtUsd(bonusAllocation)}</strong>
      </div>
      <table class="sub">
        <thead>
          <tr>
            <th>Seq</th>
            <th class="al-r">Target Revenue</th>
            <th class="al-r">Profit Share %</th>
            <th class="al-r">Profit Share $ Pool</th>
          </tr>
        </thead>
        <tbody>${milestoneRows}</tbody>
      </table>
      <div style="font-size:9px;color:#9ca3af;margin-top:8px">
        Active Milestone: <strong style="color:#7C3AED">${config.active_milestone_sequence}</strong>
      </div>
    </div>

    <!-- Allocation Summary -->
    <div class="card">
      <h3 class="blue">Allocation Summary</h3>
      <div class="summary-row">
        <span>% Budget</span>
        <span class="val ${budgetPct > 1 ? 'red' : 'green'}">${fmtPct(budgetPct)}</span>
      </div>
      <div class="summary-row">
        <span>Adjustment</span>
        <span class="val ${adjustment > 0 ? 'red' : 'green'}">${adjustment > 0 ? '-' : '+'}${fmtPct(Math.abs(adjustment))}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row">
        <span>Perf. Allocation (${(perfWeight * 100).toFixed(0)}%)</span>
        <span class="val">${fmtUsd(perfAllocation)}</span>
      </div>
      <div class="summary-row">
        <span>Tenure Allocation (${(tenureWeight * 100).toFixed(0)}%)</span>
        <span class="val">${fmtUsd(tenureAllocation)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row">
        <span>Total Pool (100%)</span>
        <span class="val" style="color:#7C3AED;font-size:12px">${fmtUsd(milestonePool)}</span>
      </div>
    </div>

    <!-- Guidance Ranges -->
    <div class="card">
      <h3 class="green">Guidance Ranges</h3>
      <table class="sub">
        <thead>
          <tr>
            <th>Rating</th>
            <th>Range</th>
            <th class="al-r">Milestone 2</th>
            <th class="al-r">Milestone 3</th>
            <th class="al-r">Milestone 4</th>
          </tr>
        </thead>
        <tbody>${guidanceRows}</tbody>
      </table>
    </div>

    <!-- Rating Weights -->
    <div class="card">
      <h3 class="yellow">Rating Weights</h3>
      <table class="sub">
        <thead>
          <tr>
            <th>Perf Rating</th>
            <th class="al-r">Weighted Value</th>
          </tr>
        </thead>
        <tbody>${ratingRows}</tbody>
      </table>
    </div>
  </div>
</div>

</body></html>`;

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfData = await page.pdf({
    width: '16.5in',
    height: '11.7in',
    margin: { top: '0.3in', right: '0.3in', bottom: '0.5in', left: '0.3in' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:7px;color:#6b7280;width:100%;text-align:center;padding:0 28px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span>  &nbsp;|&nbsp;  StrategyBRIX Confidential</div>',
  });

  const pdfBuffer = Buffer.from(pdfData);
  await browser.close();
  return pdfBuffer;
}

module.exports = { generateBonusPdf };
