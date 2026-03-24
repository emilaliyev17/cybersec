const ExcelJS = require('exceljs');
const { fmt, fmtDate, RATING_WEIGHTS } = require('./bonusCalculations');

const COLORS = {
  body: '0F172A',
  bodyAlt: '111827',
  header: '1E293B',
  border: '1E293B',
  white: 'FFFFFF',
  gray300: 'D1D5DB',
  gray400: '9CA3AF',
  gray500: '6B7280',
  nanoBlue: '209CE9',
  nanoBlueBg: '0D2847',
  nanoPurple: '7C3AED',
  nanoPurpleBg: '1A1040',
  bananoYellow: 'FBDD11',
  bananoYellowBg: '2A2510',
  rose: 'F87171',
  roseBg: '2A1015',
  empBg: '151C2C',
  green: '4ADE80',
};

const FONT_BASE = { name: 'Calibri', size: 8, color: { argb: COLORS.gray300 } };
const FONT_HEADER = { name: 'Calibri', size: 7, bold: true, color: { argb: COLORS.gray400 } };
const FONT_SECTION = { name: 'Calibri', size: 7, bold: true };
const FONT_TOTALS = { name: 'Calibri', size: 8, bold: true, color: { argb: COLORS.white } };
const FONT_TITLE = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.white } };
const FONT_SUB = { name: 'Calibri', size: 9, color: { argb: COLORS.gray400 } };
const FONT_CONF = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.nanoPurple } };

const THIN_BORDER = { style: 'thin', color: { argb: COLORS.border } };
const CELL_BORDER = { top: THIN_BORDER, bottom: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER };

function fillCell(cell, bgColor) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
}

function styleCell(cell, font, bgColor, numFmt, alignment) {
  cell.font = font || FONT_BASE;
  if (bgColor) fillCell(cell, bgColor);
  cell.border = CELL_BORDER;
  if (numFmt) cell.numFmt = numFmt;
  cell.alignment = { vertical: 'middle', horizontal: alignment || 'left', ...(alignment === 'right' ? {} : {}) };
}

async function generateBonusExcel({ config, computed, fxRates }) {
  const { rows, totals, bonusAllocation } = computed;
  const activeRows = rows.filter(r => r.is_active);
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const programName = config.program_name || 'Bonus Program';
  const year = config.year || new Date().getFullYear();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'StrategyBRIX';
  wb.created = new Date();

  const ws = wb.addWorksheet('Comp Data & Bonus Pool', {
    properties: { defaultColWidth: 12 },
    views: [{ state: 'frozen', ySplit: 5, xSplit: 2 }],
  });

  // --- Title rows ---
  ws.mergeCells('A1:AD1');
  const titleCell = ws.getCell('A1');
  titleCell.value = `StrategyBRIX — ${programName} ${year}`;
  titleCell.font = FONT_TITLE;
  fillCell(titleCell, COLORS.body);
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:N2');
  const subCell = ws.getCell('A2');
  subCell.value = `Compensation Data & Bonus Pool Analysis  |  Generated: ${date}  |  Bonus Allocation: $${fmt(bonusAllocation)}`;
  subCell.font = FONT_SUB;
  fillCell(subCell, COLORS.body);

  ws.mergeCells('O2:AD2');
  const confCell = ws.getCell('O2');
  confCell.value = 'CONFIDENTIAL';
  confCell.font = FONT_CONF;
  confCell.alignment = { horizontal: 'right', vertical: 'middle' };
  fillCell(confCell, COLORS.body);
  ws.getRow(2).height = 18;

  // Fill row 3 as spacer
  ws.getRow(3).height = 4;
  for (let c = 1; c <= 30; c++) fillCell(ws.getCell(3, c), COLORS.body);

  // --- Column definitions ---
  const columns = [
    // Employee (cols 1-4)
    { header: 'Resource', key: 'resource', width: 18, section: 'emp' },
    { header: 'Title', key: 'title', width: 16, section: 'emp' },
    { header: 'Join Date', key: 'joinDate', width: 10, section: 'emp' },
    { header: 'Tenure (Yrs)', key: 'tenure', width: 10, section: 'emp', fmt: '0.0', align: 'right' },
    // BOY Comp (cols 5-14)
    { header: 'Comp (LCY)', key: 'totalCompLcy', width: 13, section: 'boy', fmt: '#,##0', align: 'right' },
    { header: 'LCY', key: 'currency', width: 5, section: 'boy', align: 'center' },
    { header: 'Comp (USD)', key: 'totalCompUsd', width: 13, section: 'boy', fmt: '$#,##0', align: 'right' },
    { header: 'Sal (LCY)', key: 'salaryLcy', width: 12, section: 'boy', fmt: '#,##0', align: 'right' },
    { header: 'Sal (USD)', key: 'salaryUsd', width: 12, section: 'boy', fmt: '$#,##0', align: 'right' },
    { header: 'Bonus %', key: 'bonusPct', width: 9, section: 'boy', fmt: '0.00%', align: 'right' },
    { header: 'Bonus (LCY)', key: 'bonusLcy', width: 12, section: 'boy', fmt: '#,##0', align: 'right' },
    { header: 'Bonus (USD)', key: 'bonusUsd', width: 12, section: 'boy', fmt: '$#,##0', align: 'right' },
    { header: 'Sign-on (LCY)', key: 'signOnLcy', width: 12, section: 'boy', fmt: '#,##0', align: 'right' },
    { header: 'Sign-on (USD)', key: 'signOnUsd', width: 12, section: 'boy', fmt: '$#,##0', align: 'right' },
    // Midyear (cols 15-17)
    { header: 'Eligible', key: 'eligible', width: 7, section: 'mid', align: 'center' },
    { header: 'Spot (LCY)', key: 'spotLcy', width: 11, section: 'mid', fmt: '#,##0', align: 'right' },
    { header: 'Spot (USD)', key: 'spotUsd', width: 11, section: 'mid', fmt: '$#,##0', align: 'right' },
    // Pickup Bonus (cols 18-28)
    { header: 'Rating', key: 'rating', width: 7, section: 'pool', fmt: '0.00', align: 'center' },
    { header: 'Range', key: 'targetRange', width: 8, section: 'pool', align: 'center' },
    { header: 'Perf %', key: 'perfContribPct', width: 8, section: 'pool', fmt: '0.00%', align: 'right' },
    { header: 'Init Perf', key: 'initPerf', width: 10, section: 'pool', fmt: '$#,##0', align: 'right' },
    { header: 'Adj Perf', key: 'adjPerf', width: 10, section: 'pool', fmt: '$#,##0', align: 'right' },
    { header: 'Tenure %', key: 'tenurePct', width: 9, section: 'pool', fmt: '0.00%', align: 'right' },
    { header: 'Tenure $', key: 'tenureUsd', width: 10, section: 'pool', fmt: '$#,##0', align: 'right' },
    { header: 'Init Pool', key: 'initPool', width: 10, section: 'pool', fmt: '$#,##0', align: 'right' },
    { header: 'Final Pool (USD)', key: 'finalPoolUsd', width: 14, section: 'pool', fmt: '$#,##0', align: 'right' },
    { header: 'Final Pool (LCY)', key: 'finalPoolLcy', width: 14, section: 'pool', fmt: '#,##0', align: 'right' },
    { header: '% Sal', key: 'poolPctSal', width: 8, section: 'pool', fmt: '0.00%', align: 'right' },
    // EOY (cols 29-31)
    { header: 'Comp (LCY)', key: 'eoyCompLcy', width: 13, section: 'eoy', fmt: '#,##0', align: 'right' },
    { header: 'Comp (USD)', key: 'eoyCompUsd', width: 13, section: 'eoy', fmt: '$#,##0', align: 'right' },
    { header: 'Bonus %', key: 'eoyBonusPct', width: 9, section: 'eoy', fmt: '0.00%', align: 'right' },
  ];

  // Set column widths
  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  // --- Section header row (row 4) ---
  const sectionRow = ws.getRow(4);
  sectionRow.height = 20;
  const sections = [
    { label: 'Employee', start: 1, end: 4, bg: COLORS.empBg, color: COLORS.gray300 },
    { label: 'Beginning of Year Compensation', start: 5, end: 14, bg: COLORS.nanoBlueBg, color: COLORS.nanoBlue },
    { label: 'Midyear / Spot', start: 15, end: 17, bg: COLORS.bananoYellowBg, color: COLORS.bananoYellow },
    { label: 'Pickup Bonus Pool', start: 18, end: 28, bg: COLORS.nanoPurpleBg, color: COLORS.nanoPurple },
    { label: 'End of Year Comp', start: 29, end: 31, bg: COLORS.roseBg, color: COLORS.rose },
  ];
  sections.forEach(s => {
    ws.mergeCells(4, s.start, 4, s.end);
    const cell = ws.getCell(4, s.start);
    cell.value = s.label;
    cell.font = { ...FONT_SECTION, color: { argb: s.color } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = CELL_BORDER;
    for (let c = s.start; c <= s.end; c++) fillCell(ws.getCell(4, c), s.bg);
  });

  // --- Column header row (row 5) ---
  const headerRow = ws.getRow(5);
  headerRow.height = 22;
  const sectionBgMap = { emp: COLORS.empBg, boy: COLORS.nanoBlueBg, mid: COLORS.bananoYellowBg, pool: COLORS.nanoPurpleBg, eoy: COLORS.roseBg };
  const sectionColorMap = { emp: COLORS.gray400, boy: '7DD3FC', mid: 'FDE68A', pool: 'C4B5FD', eoy: 'FCA5A5' };

  columns.forEach((col, i) => {
    const cell = ws.getCell(5, i + 1);
    cell.value = col.header;
    cell.font = { ...FONT_HEADER, color: { argb: sectionColorMap[col.section] } };
    cell.alignment = { horizontal: col.align || 'left', vertical: 'middle', wrapText: true };
    cell.border = CELL_BORDER;
    fillCell(cell, sectionBgMap[col.section]);
  });

  // --- Data rows ---
  const dataStartRow = 6;
  activeRows.forEach((r, idx) => {
    const rowNum = dataStartRow + idx;
    const row = ws.getRow(rowNum);
    row.height = 18;
    const bg = idx % 2 === 0 ? COLORS.bodyAlt : COLORS.body;

    const salCol = 9; // Salary (USD) column (1-indexed)
    const finalPoolUsdCol = 26;
    const finalPoolLcyCol = 27;
    const salLcyCol = 8;

    const values = [
      r.resource_name || '-',
      r.title || '-',
      fmtDate(r.join_date),
      r.tenure,
      r.totalCompLcy,
      r.currency,
      r.totalCompUsd,
      r.salaryLcy,
      r.salaryUsd,
      r.bonusPct,
      r.bonusLcy,
      r.bonusUsd,
      r.signOnLcy,
      r.signOnUsd,
      r.eligible ? 'Y' : 'N',
      r.spotLcy,
      r.spotUsd,
      r.rating,
      r.targetRange || '-',
      r.perfContribPct,
      r.initialPerfPortion,
      r.adjustedPerfPortion,
      r.tenureContribPct,
      r.tenurePortion,
      r.initialPoolUsd,
      r.finalPoolUsd,
      r.finalPoolLcy,
      // Pool % Sal — Excel formula
      null,
      r.eoyCompLcy,
      r.eoyCompUsd,
      r.eoyBonusPct,
    ];

    values.forEach((val, ci) => {
      const cell = ws.getCell(rowNum, ci + 1);
      const col = columns[ci];
      if (val !== null) cell.value = val;
      styleCell(cell, FONT_BASE, bg, col.fmt, col.align);
    });

    // Pool % Sal formula: =Final Pool LCY / Salary LCY
    const pctCell = ws.getCell(rowNum, 28);
    const salLcyRef = ws.getCell(rowNum, salLcyCol).address;
    const finalLcyRef = ws.getCell(rowNum, finalPoolLcyCol).address;
    pctCell.value = { formula: `IF(${salLcyRef}=0,0,${finalLcyRef}/${salLcyRef})` };
    styleCell(pctCell, FONT_BASE, bg, '0.00%', 'right');

    // Highlight capped cells in red
    if (r.capped) {
      const fpUsdCell = ws.getCell(rowNum, finalPoolUsdCol);
      fpUsdCell.font = { ...FONT_BASE, color: { argb: COLORS.rose } };
      const fpLcyCell = ws.getCell(rowNum, finalPoolLcyCol);
      fpLcyCell.font = { ...FONT_BASE, color: { argb: COLORS.rose } };
    }
  });

  // --- Totals row ---
  const totalsRowNum = dataStartRow + activeRows.length;
  const totalsRow = ws.getRow(totalsRowNum);
  totalsRow.height = 22;

  // Fill all cells first
  for (let c = 1; c <= 31; c++) {
    const cell = ws.getCell(totalsRowNum, c);
    styleCell(cell, FONT_TOTALS, COLORS.header, null, 'right');
    cell.border = {
      ...CELL_BORDER,
      top: { style: 'medium', color: { argb: COLORS.nanoPurple } },
    };
  }

  ws.getCell(totalsRowNum, 1).value = 'Totals';
  ws.getCell(totalsRowNum, 1).alignment = { horizontal: 'left', vertical: 'middle' };

  // SUM formulas for totals
  const lastDataRow = totalsRowNum - 1;
  const sumCols = [5, 7, 8, 9, 11, 12, 13, 14, 16, 17, 21, 22, 24, 25, 26, 27, 29, 30];
  sumCols.forEach(c => {
    const colLetter = ws.getCell(dataStartRow, c).address.replace(/\d+/, '');
    const cell = ws.getCell(totalsRowNum, c);
    cell.value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${lastDataRow})` };
    const col = columns[c - 1];
    if (col && col.fmt) cell.numFmt = col.fmt;
  });

  // --- Footnote ---
  const noteRow = totalsRowNum + 1;
  ws.mergeCells(noteRow, 1, noteRow, 10);
  const noteCell = ws.getCell(noteRow, 1);
  noteCell.value = '*Excludes contractors and ineligible employees from pool calculations';
  noteCell.font = { name: 'Calibri', size: 7, italic: true, color: { argb: COLORS.gray500 } };
  fillCell(noteCell, COLORS.body);

  // --- Print setup ---
  ws.pageSetup = {
    orientation: 'landscape',
    paperSize: 8, // A3
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = { generateBonusExcel };
