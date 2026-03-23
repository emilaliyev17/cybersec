const FX_FALLBACK = { CAD: 1.36, USD: 1, GBP: 0.79, INR: 83.5, MAD: 9.8 };
const RATING_WEIGHTS = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 4 };

function fxToUsd(amount, currency, rates) {
  const rate = rates[currency] || 1;
  return rate === 0 ? 0 : amount / rate;
}

function usdToLcy(amountUsd, currency, rates) {
  const rate = rates[currency] || 1;
  return amountUsd * rate;
}

function tenureYears(joinDate) {
  if (!joinDate) return 0;
  const now = new Date();
  const join = new Date(joinDate);
  return Math.max(0, (now - join) / (365.25 * 24 * 60 * 60 * 1000));
}

function lookupGuidancePct(guidanceRanges, rating, targetRange, milestoneSeq) {
  if (!rating || !targetRange || rating < 3) return 0;
  const ratingInt = Math.round(rating);
  const entry = guidanceRanges.find(
    g => g.rating === ratingInt && g.target_range === targetRange
  );
  if (!entry) return 0;
  if (milestoneSeq === 2) return parseFloat(entry.milestone2_pct) || 0;
  if (milestoneSeq === 3) return parseFloat(entry.milestone3_pct) || 0;
  if (milestoneSeq === 4) return parseFloat(entry.milestone4_pct) || 0;
  return 0;
}

function fmt(val, decimals = 0) {
  if (val == null || isNaN(val)) return '-';
  return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtUsd(val, decimals = 0) {
  if (val == null || isNaN(val)) return '-';
  return '$' + fmt(val, decimals);
}

function fmtPct(val, decimals = 2) {
  if (val == null || isNaN(val)) return '-';
  return (val * 100).toFixed(decimals) + '%';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(-2)}`;
}

function computeBonusData({ config, milestones, guidanceRanges, employees, fxRates }) {
  const rates = fxRates || FX_FALLBACK;
  const milestoneSeq = config.active_milestone_sequence;
  const perfWeight = parseFloat(config.perf_weight);
  const tenureWeight = parseFloat(config.tenure_weight);

  const rows = employees.map(emp => {
    const salaryLcy = parseInt(emp.salary_lcy) || 0;
    const bonusPct = parseFloat(emp.bonus_pct) || 0;
    const signOnLcy = parseInt(emp.sign_on_bonus_lcy) || 0;
    const spotLcy = parseInt(emp.spot_bonus_lcy) || 0;
    const currency = emp.lcy_currency || 'USD';
    const tenure = tenureYears(emp.join_date);
    const salaryUsd = fxToUsd(salaryLcy, currency, rates);
    const bonusLcy = Math.round(salaryLcy * bonusPct);
    const bonusUsd = salaryUsd * bonusPct;
    const signOnUsd = fxToUsd(signOnLcy, currency, rates);
    const spotUsd = fxToUsd(spotLcy, currency, rates);
    const manualTotalCompLcy = emp.total_comp_lcy != null ? parseInt(emp.total_comp_lcy) : null;
    const totalCompLcy = manualTotalCompLcy || (salaryLcy + bonusLcy + signOnLcy);
    const totalCompUsd = fxToUsd(totalCompLcy, currency, rates);
    const rating = emp.rating != null ? parseFloat(emp.rating) : null;
    const targetRange = emp.target_range;
    const perfContribPct = lookupGuidancePct(guidanceRanges, rating, targetRange, milestoneSeq);

    return {
      ...emp,
      tenure, salaryUsd, bonusLcy, bonusUsd, signOnUsd, spotUsd,
      totalCompLcy, totalCompUsd, perfContribPct, rating, targetRange,
      currency, salaryLcy, bonusPct, signOnLcy, spotLcy,
    };
  });

  const totalBonusUsd = rows.reduce((s, r) => s + r.bonusUsd, 0);
  const bonusAllocation = Math.round(totalBonusUsd / 1000) * 1000;

  const milestoneData = milestones.map(m => ({
    ...m,
    profitSharePool: bonusAllocation * parseFloat(m.profit_share_pct),
  }));

  const activeMilestone = milestoneData.find(m => m.sequence === milestoneSeq);
  const milestonePool = activeMilestone ? activeMilestone.profitSharePool : 0;
  const perfAllocation = milestonePool * perfWeight;
  const tenureAllocation = milestonePool * tenureWeight;

  const rowsWithPerf = rows.map(r => {
    const initialPerfPortion = r.perfContribPct * r.salaryUsd;
    return { ...r, initialPerfPortion };
  });

  const sumInitialPerf = rowsWithPerf.filter(r => r.is_active).reduce((s, r) => s + r.initialPerfPortion, 0);
  const budgetPct = perfAllocation > 0 ? sumInitialPerf / perfAllocation : 0;
  const adjustment = budgetPct - 1;

  const eligibleWithPerf = rowsWithPerf.filter(r => r.is_active && r.eligible && r.initialPerfPortion > 0);
  const totalTenureEligible = eligibleWithPerf.reduce((s, r) => s + r.tenure, 0);

  const finalRows = rowsWithPerf.map(r => {
    const adjustedPerfPortion = budgetPct > 0 ? r.initialPerfPortion * (1 / budgetPct) : r.initialPerfPortion;
    const tenureContribPct = r.is_active && r.eligible && r.initialPerfPortion > 0 && totalTenureEligible > 0
      ? r.tenure / totalTenureEligible : 0;
    const tenurePortion = tenureContribPct * tenureAllocation;
    const initialPoolUsd = r.initialPerfPortion + tenurePortion;
    const finalPoolUsd = adjustedPerfPortion + tenurePortion;
    const finalPoolLcy = usdToLcy(finalPoolUsd, r.currency, rates);
    const eoyCompUsd = r.salaryUsd + r.bonusUsd + r.spotUsd + finalPoolUsd;
    const eoyCompLcy = usdToLcy(eoyCompUsd, r.currency, rates);
    const eoyBonusPct = r.salaryUsd > 0 ? finalPoolUsd / r.salaryUsd : 0;

    return {
      ...r, adjustedPerfPortion, tenureContribPct, tenurePortion,
      initialPoolUsd, finalPoolUsd, finalPoolLcy, eoyCompUsd, eoyCompLcy, eoyBonusPct,
    };
  });

  const activeRows = finalRows.filter(r => r.is_active);
  const totals = {
    salaryLcy: activeRows.reduce((s, r) => s + r.salaryLcy, 0),
    salaryUsd: activeRows.reduce((s, r) => s + r.salaryUsd, 0),
    bonusLcy: activeRows.reduce((s, r) => s + r.bonusLcy, 0),
    bonusUsd: activeRows.reduce((s, r) => s + r.bonusUsd, 0),
    signOnLcy: activeRows.reduce((s, r) => s + r.signOnLcy, 0),
    signOnUsd: activeRows.reduce((s, r) => s + r.signOnUsd, 0),
    totalCompLcy: activeRows.reduce((s, r) => s + r.totalCompLcy, 0),
    totalCompUsd: activeRows.reduce((s, r) => s + r.totalCompUsd, 0),
    spotLcy: activeRows.reduce((s, r) => s + r.spotLcy, 0),
    spotUsd: activeRows.reduce((s, r) => s + r.spotUsd, 0),
    initialPerfPortion: activeRows.reduce((s, r) => s + r.initialPerfPortion, 0),
    adjustedPerfPortion: activeRows.reduce((s, r) => s + r.adjustedPerfPortion, 0),
    tenurePortion: activeRows.reduce((s, r) => s + r.tenurePortion, 0),
    initialPoolUsd: activeRows.reduce((s, r) => s + r.initialPoolUsd, 0),
    finalPoolUsd: activeRows.reduce((s, r) => s + r.finalPoolUsd, 0),
    finalPoolLcy: activeRows.reduce((s, r) => s + r.finalPoolLcy, 0),
    eoyCompLcy: activeRows.reduce((s, r) => s + r.eoyCompLcy, 0),
    eoyCompUsd: activeRows.reduce((s, r) => s + r.eoyCompUsd, 0),
  };

  return {
    rows: finalRows, totals, bonusAllocation, milestoneData, milestonePool,
    perfAllocation, tenureAllocation, budgetPct, adjustment, perfWeight, tenureWeight,
  };
}

module.exports = {
  computeBonusData, fxToUsd, usdToLcy, tenureYears, lookupGuidancePct,
  fmt, fmtUsd, fmtPct, fmtDate, FX_FALLBACK, RATING_WEIGHTS,
};
