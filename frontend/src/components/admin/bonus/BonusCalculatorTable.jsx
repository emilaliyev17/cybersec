import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { apiUrl } from '../../../config/api';

const FX_RATES = { CAD: 0.735, USD: 1, GBP: 1.32, INR: 0.012, MAD: 0.107 };
const CURRENCIES = ['CAD', 'USD', 'GBP', 'INR', 'MAD'];
const RATING_WEIGHTS = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 4 };

function fxToUsd(amount, currency) {
  return amount * (FX_RATES[currency] || 1);
}

function usdToLcy(amount, currency) {
  const rate = FX_RATES[currency] || 1;
  return rate === 0 ? 0 : amount / rate;
}

function fmt(val, decimals = 0) {
  if (val == null || isNaN(val)) return '-';
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function tenureYears(joinDate) {
  if (!joinDate) return 0;
  const now = new Date();
  const join = new Date(joinDate);
  return Math.max(0, (now - join) / (365.25 * 24 * 60 * 60 * 1000));
}

function lookupGuidancePct(guidanceRanges, rating, targetRange, milestoneSeq) {
  if (!rating || !targetRange || rating < 3) return 0;
  const entry = guidanceRanges.find(
    g => g.rating === rating && g.target_range === targetRange
  );
  if (!entry) return 0;
  if (milestoneSeq === 2) return parseFloat(entry.milestone2_pct) || 0;
  if (milestoneSeq === 3) return parseFloat(entry.milestone3_pct) || 0;
  if (milestoneSeq === 4) return parseFloat(entry.milestone4_pct) || 0;
  return 0;
}

export default function BonusCalculatorTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveTimers = useRef({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl('/api/bonus/calculator/1'));
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch bonus data:', err);
      setError('Failed to load bonus calculator data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEmployee = useCallback((empId, updates) => {
    if (saveTimers.current[empId]) clearTimeout(saveTimers.current[empId]);
    saveTimers.current[empId] = setTimeout(async () => {
      try {
        await axios.put(apiUrl(`/api/bonus/employee/${empId}`), updates);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 500);
  }, []);

  const updateEmployee = useCallback((empId, field, value) => {
    setData(prev => {
      if (!prev) return prev;
      const employees = prev.employees.map(e => {
        if (e.id !== empId) return e;
        return { ...e, [field]: value };
      });
      return { ...prev, employees };
    });

    const updates = { [field]: value };
    saveEmployee(empId, updates);
  }, [saveEmployee]);

  const updateMilestone = useCallback(async (newSeq) => {
    try {
      await axios.put(apiUrl(`/api/bonus/config/${data.config.id}`), {
        active_milestone_sequence: newSeq,
      });
      setData(prev => ({
        ...prev,
        config: { ...prev.config, active_milestone_sequence: newSeq },
      }));
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  }, [data]);

  const updateWeights = useCallback(async (perfWeight, tenureWeight) => {
    try {
      await axios.put(apiUrl(`/api/bonus/config/${data.config.id}/weights`), {
        perf_weight: perfWeight,
        tenure_weight: tenureWeight,
      });
      setData(prev => ({
        ...prev,
        config: { ...prev.config, perf_weight: perfWeight, tenure_weight: tenureWeight },
      }));
    } catch (err) {
      console.error('Failed to update weights:', err);
    }
  }, [data]);

  const computed = useMemo(() => {
    if (!data) return null;
    const { config, milestones, guidanceRanges, employees } = data;
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

      const salaryUsd = fxToUsd(salaryLcy, currency);
      const bonusLcy = Math.round(salaryLcy * bonusPct);
      const bonusUsd = salaryUsd * bonusPct;
      const signOnUsd = fxToUsd(signOnLcy, currency);
      const spotUsd = fxToUsd(spotLcy, currency);
      const totalCompLcy = salaryLcy + bonusLcy + signOnLcy;
      const totalCompUsd = salaryUsd + bonusUsd + signOnUsd;

      const rating = emp.rating ? parseInt(emp.rating) : null;
      const targetRange = emp.target_range;
      const perfContribPct = lookupGuidancePct(guidanceRanges, rating, targetRange, milestoneSeq);

      return {
        ...emp,
        tenure,
        salaryUsd,
        bonusLcy,
        bonusUsd,
        signOnUsd,
        spotUsd,
        totalCompLcy,
        totalCompUsd,
        perfContribPct,
        rating,
        targetRange,
        currency,
        salaryLcy,
        bonusPct,
        signOnLcy,
        spotLcy,
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

    const sumInitialPerf = rowsWithPerf
      .filter(r => r.is_active)
      .reduce((s, r) => s + r.initialPerfPortion, 0);
    const budgetPct = perfAllocation > 0 ? sumInitialPerf / perfAllocation : 0;
    const adjustment = budgetPct - 1;

    const eligibleWithPerf = rowsWithPerf.filter(
      r => r.is_active && r.eligible && r.initialPerfPortion > 0
    );
    const totalTenureEligible = eligibleWithPerf.reduce((s, r) => s + r.tenure, 0);

    const finalRows = rowsWithPerf.map(r => {
      let adjustedPerfPortion;
      if (budgetPct > 1) {
        adjustedPerfPortion = r.initialPerfPortion * (1 / budgetPct);
      } else {
        adjustedPerfPortion = r.initialPerfPortion * (1 / budgetPct);
      }

      const tenureContribPct =
        r.is_active && r.eligible && r.initialPerfPortion > 0 && totalTenureEligible > 0
          ? r.tenure / totalTenureEligible
          : 0;
      const tenurePortion = tenureContribPct * tenureAllocation;

      const initialPoolUsd = r.initialPerfPortion + tenurePortion;
      const finalPoolUsd = adjustedPerfPortion + tenurePortion;
      const finalPoolLcy = usdToLcy(finalPoolUsd, r.currency);

      const eoyCompUsd = r.salaryUsd + r.bonusUsd + r.spotUsd + finalPoolUsd;
      const eoyCompLcy = usdToLcy(eoyCompUsd, r.currency);
      const eoyBonusPct = r.salaryUsd > 0 ? finalPoolUsd / r.salaryUsd : 0;

      return {
        ...r,
        adjustedPerfPortion,
        tenureContribPct,
        tenurePortion,
        initialPoolUsd,
        finalPoolUsd,
        finalPoolLcy,
        eoyCompUsd,
        eoyCompLcy,
        eoyBonusPct,
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
      rows: finalRows,
      totals,
      bonusAllocation,
      milestoneData,
      milestonePool,
      perfAllocation,
      tenureAllocation,
      budgetPct,
      adjustment,
      perfWeight,
      tenureWeight,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nano-purple" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-nano-purple text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (!computed) return null;

  const { rows, totals, bonusAllocation, milestoneData, milestonePool, perfAllocation, tenureAllocation, budgetPct, adjustment, perfWeight, tenureWeight } = computed;
  const { config, guidanceRanges } = data;

  const thBase = 'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide border border-white/5 whitespace-nowrap text-gray-400';
  const tdBase = 'px-2 py-1 text-xs border border-white/5 whitespace-nowrap';
  const inputBase = 'no-spinner border border-white/10 rounded px-1.5 py-0.5 w-full bg-white/5 text-xs text-white focus:ring-1 focus:ring-nano-blue/50 focus:border-nano-blue/50 focus:outline-none';
  const calcCell = 'bg-white/[0.02] text-gray-400';

  return (
    <div className="space-y-6">
      {/* Main Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap text-gray-300 border-collapse">
            <thead>
              {/* Section headers row */}
              <tr>
                <th colSpan={4} className={`${thBase} bg-white/5 text-gray-300 text-center`}>Employee</th>
                <th colSpan={10} className={`${thBase} bg-nano-blue/20 text-nano-blue text-center`}>Beginning of Year Compensation</th>
                <th colSpan={3} className={`${thBase} bg-banano-yellow/15 text-banano-yellow text-center`}>Midyear / Spot Bonus</th>
                <th colSpan={10} className={`${thBase} bg-nano-purple/20 text-nano-purple text-center`}>Pickup Bonus Pool</th>
                <th colSpan={3} className={`${thBase} bg-rose-500/15 text-rose-400 text-center`}>End of Year Comp</th>
              </tr>
              {/* Column headers row */}
              <tr>
                {/* Employee */}
                <th className={`${thBase} bg-white/5`}>Resource</th>
                <th className={`${thBase} bg-white/5`}>Title</th>
                <th className={`${thBase} bg-white/5`}>Join Date</th>
                <th className={`${thBase} bg-white/5`}>Tenure (Yrs)</th>
                {/* BOY Comp */}
                <th className={`${thBase} bg-nano-blue/5`}>Total Comp (LCY)</th>
                <th className={`${thBase} bg-nano-blue/5`}>LCY</th>
                <th className={`${thBase} bg-nano-blue/5`}>Total Comp (USD)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Salary (LCY)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Salary (USD)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Bonus %</th>
                <th className={`${thBase} bg-nano-blue/5`}>Bonus (LCY)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Bonus (USD)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Sign-on (LCY)</th>
                <th className={`${thBase} bg-nano-blue/5`}>Sign-on (USD)</th>
                {/* Midyear */}
                <th className={`${thBase} bg-banano-yellow/5`}>Eligible</th>
                <th className={`${thBase} bg-banano-yellow/5`}>Spot (LCY)</th>
                <th className={`${thBase} bg-banano-yellow/5`}>Spot (USD)</th>
                {/* Pickup Bonus */}
                <th className={`${thBase} bg-nano-purple/5`}>Rating</th>
                <th className={`${thBase} bg-nano-purple/5`}>Target Range</th>
                <th className={`${thBase} bg-nano-purple/5`}>Perf Contrib %</th>
                <th className={`${thBase} bg-nano-purple/5`}>Init Perf (USD)</th>
                <th className={`${thBase} bg-nano-purple/5`}>Adj Perf (USD)</th>
                <th className={`${thBase} bg-nano-purple/5`}>Tenure %</th>
                <th className={`${thBase} bg-nano-purple/5`}>Tenure (USD)</th>
                <th className={`${thBase} bg-nano-purple/5`}>Init Pool (USD)</th>
                <th className={`${thBase} bg-nano-purple/5`}>Final Pool (USD)</th>
                <th className={`${thBase} bg-nano-purple/5`}>Final Pool (LCY)</th>
                {/* EOY */}
                <th className={`${thBase} bg-rose-500/5`}>Total Comp (LCY)</th>
                <th className={`${thBase} bg-rose-500/5`}>Total Comp (USD)</th>
                <th className={`${thBase} bg-rose-500/5`}>Bonus %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const inactive = !r.is_active;
                const rowCls = inactive ? 'line-through opacity-60' : '';
                return (
                  <tr key={r.id} className={`${rowCls} hover:bg-white/5 transition-colors`}>
                    {/* Employee */}
                    <td className={`${tdBase} font-medium text-white`}>{r.resource_name}</td>
                    <td className={tdBase}>{r.title || '-'}</td>
                    <td className={tdBase}>{fmtDate(r.join_date)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{r.tenure.toFixed(2)}</td>
                    {/* BOY Comp */}
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmt(r.totalCompLcy)}</td>
                    <td className={tdBase}>
                      <select
                        value={r.currency}
                        onChange={e => updateEmployee(r.id, 'lcy_currency', e.target.value)}
                        className={`${inputBase} w-16`}
                      >
                        {CURRENCIES.map(c => <option key={c} value={c} className="bg-[#1E293B] text-white">{c}</option>)}
                      </select>
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.totalCompUsd)}</td>
                    <td className={tdBase}>
                      <input
                        type="number"
                        value={r.salaryLcy}
                        onChange={e => updateEmployee(r.id, 'salary_lcy', parseInt(e.target.value) || 0)}
                        className={`${inputBase} w-28 text-right`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.salaryUsd)}</td>
                    <td className={tdBase}>
                      <input
                        type="number"
                        step="0.01"
                        value={((parseFloat(r.bonus_pct) || 0) * 100).toFixed(2)}
                        onChange={e => updateEmployee(r.id, 'bonus_pct', (parseFloat(e.target.value) || 0) / 100)}
                        className={`${inputBase} w-20 text-right`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmt(r.bonusLcy)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.bonusUsd)}</td>
                    <td className={tdBase}>
                      <input
                        type="number"
                        value={r.signOnLcy}
                        onChange={e => updateEmployee(r.id, 'sign_on_bonus_lcy', parseInt(e.target.value) || 0)}
                        className={`${inputBase} w-20 text-right`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.signOnUsd)}</td>
                    {/* Midyear */}
                    <td className={tdBase}>
                      <select
                        value={r.eligible ? 'Y' : 'N'}
                        onChange={e => updateEmployee(r.id, 'eligible', e.target.value === 'Y')}
                        className={`${inputBase} w-12`}
                      >
                        <option value="Y" className="bg-[#1E293B] text-white">Y</option>
                        <option value="N" className="bg-[#1E293B] text-white">N</option>
                      </select>
                    </td>
                    <td className={tdBase}>
                      <input
                        type="number"
                        value={r.spotLcy}
                        onChange={e => updateEmployee(r.id, 'spot_bonus_lcy', parseInt(e.target.value) || 0)}
                        className={`${inputBase} w-20 text-right`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.spotUsd)}</td>
                    {/* Pickup Bonus */}
                    <td className={tdBase}>
                      <select
                        value={r.rating || ''}
                        onChange={e => updateEmployee(r.id, 'rating', e.target.value ? parseInt(e.target.value) : null)}
                        className={`${inputBase} w-12`}
                      >
                        <option value="" className="bg-[#1E293B] text-white">-</option>
                        {[1,2,3,4,5].map(v => <option key={v} value={v} className="bg-[#1E293B] text-white">{v}</option>)}
                      </select>
                    </td>
                    <td className={tdBase}>
                      <select
                        value={r.targetRange || ''}
                        onChange={e => updateEmployee(r.id, 'target_range', e.target.value || null)}
                        className={`${inputBase} w-20`}
                      >
                        <option value="" className="bg-[#1E293B] text-white">-</option>
                        {['Low','Medium','High'].map(v => <option key={v} value={v} className="bg-[#1E293B] text-white">{v}</option>)}
                      </select>
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtPct(r.perfContribPct)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.initialPerfPortion)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.adjustedPerfPortion)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtPct(r.tenureContribPct)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.tenurePortion)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.initialPoolUsd)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.finalPoolUsd)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmt(r.finalPoolLcy)}</td>
                    {/* EOY */}
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmt(r.eoyCompLcy)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.eoyCompUsd)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtPct(r.eoyBonusPct)}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="font-bold border-t-2 border-white/10 bg-white/5 text-white">
                <td className={`${tdBase} font-bold text-white`}>Totals</td>
                <td className={tdBase}></td>
                <td className={tdBase}></td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmt(totals.totalCompLcy)}</td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.totalCompUsd)}</td>
                <td className={`${tdBase} text-right`}>{fmt(totals.salaryLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.salaryUsd)}</td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmt(totals.bonusLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.bonusUsd)}</td>
                <td className={`${tdBase} text-right`}>{fmt(totals.signOnLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.signOnUsd)}</td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmt(totals.spotLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.spotUsd)}</td>
                <td className={tdBase}></td>
                <td className={tdBase}></td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.initialPerfPortion)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.adjustedPerfPortion)}</td>
                <td className={tdBase}></td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.tenurePortion)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.initialPoolUsd)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.finalPoolUsd)}</td>
                <td className={`${tdBase} text-right`}>{fmt(totals.finalPoolLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmt(totals.eoyCompLcy)}</td>
                <td className={`${tdBase} text-right`}>{fmtUsd(totals.eoyCompUsd)}</td>
                <td className={tdBase}></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-400 px-3 py-1.5 bg-[#0d1117]">
          *Excludes Vishal's bonus (not eligible for bonus pool)
        </p>
      </div>

      {/* Configuration Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Bonus Allocation &amp; Milestones</h4>
          <div className="mb-3 text-sm text-gray-300">
            Bonus Allocation: <span className="font-bold text-white">{fmtUsd(bonusAllocation)}</span>
          </div>
          <table className="w-full text-xs text-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Seq</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Target Revenue</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Profit Share %</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Profit Share $ Pool</th>
              </tr>
            </thead>
            <tbody>
              {milestoneData.map(m => {
                const isActive = m.sequence === config.active_milestone_sequence;
                return (
                  <tr key={m.sequence} className={isActive ? 'bg-nano-purple/15 text-white font-semibold' : 'hover:bg-white/5'}>
                    <td className="px-3 py-1.5 border-t border-white/5">{m.sequence}</td>
                    <td className="px-3 py-1.5 border-t border-white/5 text-right">{fmtUsd(parseInt(m.target_revenue))}</td>
                    <td className="px-3 py-1.5 border-t border-white/5 text-right">{fmtPct(parseFloat(m.profit_share_pct), 0)}</td>
                    <td className="px-3 py-1.5 border-t border-white/5 text-right">{fmtUsd(m.profitSharePool)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
            <span>Active Milestone:</span>
            <select
              value={config.active_milestone_sequence}
              onChange={e => updateMilestone(parseInt(e.target.value))}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
            >
              {[1,2,3,4].map(v => <option key={v} value={v} className="bg-[#1E293B] text-white">{v}</option>)}
            </select>
          </div>
        </div>

        {/* Allocation Summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Allocation Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>% Budget:</span>
              <span className={`font-bold ${budgetPct > 1 ? 'text-red-400' : 'text-green-400'}`}>
                {fmtPct(budgetPct)}
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Adjustment:</span>
              <span className={`font-bold ${adjustment > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {adjustment > 0 ? '-' : '+'}{fmtPct(Math.abs(adjustment))}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 mt-2" />
            <div className="flex justify-between text-gray-300">
              <span>Perf. Allocation ({(perfWeight * 100).toFixed(0)}%):</span>
              <span className="font-bold text-white">{fmtUsd(perfAllocation)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tenure Allocation ({(tenureWeight * 100).toFixed(0)}%):</span>
              <span className="font-bold text-white">{fmtUsd(tenureAllocation)}</span>
            </div>
            <div className="flex justify-between text-gray-300 border-t border-white/10 pt-2">
              <span>Total Pool (100%):</span>
              <span className="font-bold text-white">{fmtUsd(milestonePool)}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Adjust Weights</p>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span>Perf:</span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={(perfWeight * 100).toFixed(0)}
                onChange={e => {
                  const p = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  updateWeights(p / 100, (100 - p) / 100);
                }}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-16 text-right"
              />
              <span>%</span>
              <span className="text-gray-500 mx-1">/</span>
              <span>Tenure:</span>
              <span className="text-white font-bold">{(tenureWeight * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Guidance Ranges */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Guidance Ranges</h4>
          <table className="w-full text-xs text-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Rating</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Range</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Milestone 2</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Milestone 3</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Milestone 4</th>
              </tr>
            </thead>
            <tbody>
              {guidanceRanges.map(g => (
                <tr key={`${g.rating}_${g.target_range}`} className="hover:bg-white/5">
                  <td className="px-3 py-1.5 border-t border-white/5">{g.rating}</td>
                  <td className="px-3 py-1.5 border-t border-white/5">{g.target_range}</td>
                  <td className="px-3 py-1.5 border-t border-white/5 text-right">
                    {fmtPct(parseFloat(g.milestone2_pct))}
                  </td>
                  <td className="px-3 py-1.5 border-t border-white/5 text-right">
                    {fmtPct(parseFloat(g.milestone3_pct))}
                  </td>
                  <td className="px-3 py-1.5 border-t border-white/5 text-right">
                    {fmtPct(parseFloat(g.milestone4_pct))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rating Weights */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Rating Weights (Weighted Value)</h4>
          <table className="w-full text-xs text-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Perf Rating</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-400">Weighted Value</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(r => (
                <tr key={r} className="hover:bg-white/5">
                  <td className="px-3 py-1.5 border-t border-white/5">{r}</td>
                  <td className="px-3 py-1.5 border-t border-white/5 text-right">{RATING_WEIGHTS[r]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
