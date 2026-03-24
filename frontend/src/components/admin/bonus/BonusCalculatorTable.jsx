import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { apiUrl } from '../../../config/api';

const CONFIG_ID = 1;

const FX_FALLBACK = { CAD: 1.36, USD: 1, GBP: 0.79, INR: 83.5, MAD: 9.8 };
const CURRENCIES = ['CAD', 'USD', 'GBP', 'INR', 'MAD'];
const RATING_WEIGHTS = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 4 };

function fxToUsd(amount, currency, rates) {
  const rate = rates[currency] || 1;
  return rate === 0 ? 0 : amount / rate;
}

function usdToLcy(amountUsd, currency, rates) {
  const rate = rates[currency] || 1;
  return amountUsd * rate;
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
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(-2)}`;
}

function parseMdyy(str) {
  if (!str || !str.trim()) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const m = parseInt(parts[0]);
  const d = parseInt(parts[1]);
  let y = parseInt(parts[2]);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  if (y < 100) y += y < 50 ? 2000 : 1900;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
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

// ─── Main component ──────────────────────────────────────────────────────────

export default function BonusCalculatorTable() {
  const [data, setData] = useState(null);
  const [tsUsers, setTsUsers] = useState([]);
  const [fxRates, setFxRates] = useState(FX_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRowActive, setNewRowActive] = useState(false);
  const [newRowSearch, setNewRowSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const newRowInputRef = useRef(null);
  const exportMenuRef = useRef(null);
  const dropdownRef = useRef(null);
  const saveTimers = useRef({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const calcRes = await axios.get(apiUrl(`/api/bonus/calculator/${CONFIG_ID}`));
      setData(calcRes.data);
    } catch (err) {
      console.error('Failed to fetch bonus data:', err);
      setError('Failed to load bonus calculator data');
    } finally {
      setLoading(false);
    }
    // Fetch ts-users and FX rates separately — don't block the main table
    try {
      const tsRes = await axios.get(apiUrl('/api/bonus/ts-users'), { timeout: 6000 });
      setTsUsers(tsRes.data.users || []);
    } catch (tsErr) {
      console.warn('ts-users unavailable (ts_man DB may not be reachable):', tsErr.message);
    }
    try {
      const fxRes = await axios.get(apiUrl('/api/bonus/fx-rates'), { timeout: 6000 });
      if (fxRes.data.rates) setFxRates(fxRes.data.rates);
    } catch (fxErr) {
      console.warn('FX rates unavailable, using fallback:', fxErr.message);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportMenuOpen]);

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
    if (data?.config?.status === 'sealed') return;
    setData(prev => {
      if (!prev) return prev;
      const employees = prev.employees.map(e => {
        if (e.id !== empId) return e;
        const updated = { ...e, [field]: value };
        if (field === 'hire_date_override') updated.join_date = value;
        if (field === 'total_comp_lcy') updated.total_comp_lcy = value;
        return updated;
      });
      return { ...prev, employees };
    });
    saveEmployee(empId, { [field]: value });
  }, [saveEmployee]);

  const filteredTsUsers = useMemo(() => {
    if (!newRowSearch.trim() || newRowSearch.length < 2) return [];
    const q = newRowSearch.toLowerCase();
    return tsUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [tsUsers, newRowSearch]);

  const handleSelectUser = useCallback(async (tsUser) => {
    setNewRowActive(false);
    setNewRowSearch('');
    setDropdownOpen(false);
    try {
      const res = await axios.post(apiUrl('/api/bonus/employee'), {
        config_id: CONFIG_ID,
        tsman_user_id: tsUser.id,
        resource_name_override: tsUser.name,
        title_override: tsUser.title || null,
        hire_date_override: null,
      });
      setData(prev => ({
        ...prev,
        employees: [...prev.employees, res.data.employee],
      }));
    } catch (err) {
      console.error('Failed to add employee:', err);
    }
  }, []);

  const handleExport = useCallback(async (format) => {
    setExporting(true);
    setExportMenuOpen(false);
    try {
      const endpoint = format === 'excel' ? 'export-excel' : 'export-pdf';
      const mimeType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const res = await axios.get(apiUrl(`/api/bonus/calculator/${CONFIG_ID}/${endpoint}`), { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bonus_Calculator_Report.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`${format} export failed:`, err);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleToggleSeal = useCallback(async () => {
    const isSealed = data.config.status === 'sealed';
    try {
      await axios.put(apiUrl(`/api/bonus/config/${CONFIG_ID}/seal`), { sealed: !isSealed });
      setData(prev => ({
        ...prev,
        config: { ...prev.config, status: isSealed ? 'draft' : 'sealed' },
      }));
    } catch (err) {
      console.error('Seal/unseal failed:', err);
    }
  }, [data]);

  const handleStartNewRow = useCallback(() => {
    setNewRowActive(true);
    setNewRowSearch('');
    setDropdownOpen(false);
    setTimeout(() => newRowInputRef.current?.focus(), 50);
  }, []);

  const handleCancelNewRow = useCallback(() => {
    setNewRowActive(false);
    setNewRowSearch('');
    setDropdownOpen(false);
  }, []);

  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!dropdownOpen) return;
    const updatePos = () => {
      if (newRowInputRef.current) {
        const rect = newRowInputRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      }
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        newRowInputRef.current && !newRowInputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleDeleteEmployee = useCallback(async (empId) => {
    if (data?.config?.status === 'sealed') return;
    try {
      await axios.delete(apiUrl(`/api/bonus/employee/${empId}`));
      setData(prev => ({
        ...prev,
        employees: prev.employees.filter(e => e.id !== empId),
      }));
    } catch (err) {
      console.error('Failed to delete employee:', err);
    }
  }, []);

  const updateMilestone = useCallback(async (newSeq) => {
    if (data?.config?.status === 'sealed') return;
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

  const updateMilestonePct = useCallback(async (milestoneId, newPct) => {
    if (data?.config?.status === 'sealed') return;
    try {
      await axios.put(apiUrl(`/api/bonus/milestone/${milestoneId}`), { profit_share_pct: newPct });
      setData(prev => ({
        ...prev,
        milestones: prev.milestones.map(m => m.id === milestoneId ? { ...m, profit_share_pct: newPct } : m),
      }));
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  }, []);

  const updateGuidanceRange = useCallback(async (rangeId, field, value) => {
    if (data?.config?.status === 'sealed') return;
    setData(prev => ({
      ...prev,
      guidanceRanges: prev.guidanceRanges.map(g => g.id === rangeId ? { ...g, [field]: value } : g),
    }));
    try {
      await axios.put(apiUrl(`/api/bonus/guidance-range/${rangeId}`), { [field]: value });
    } catch (err) {
      console.error('Failed to update guidance range:', err);
    }
  }, []);

  const updateWeights = useCallback(async (perfWeight, tenureWeight) => {
    if (data?.config?.status === 'sealed') return;
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

      const salaryUsd = fxToUsd(salaryLcy, currency, fxRates);
      const bonusLcy = Math.round(salaryLcy * bonusPct);
      const bonusUsd = salaryUsd * bonusPct;
      const signOnUsd = fxToUsd(signOnLcy, currency, fxRates);
      const spotUsd = fxToUsd(spotLcy, currency, fxRates);
      const manualTotalCompLcy = emp.total_comp_lcy != null ? parseInt(emp.total_comp_lcy) : null;
      const totalCompLcy = manualTotalCompLcy || (salaryLcy + bonusLcy + signOnLcy);
      const totalCompUsd = fxToUsd(totalCompLcy, currency, fxRates);

      const rating = emp.rating != null ? parseFloat(emp.rating) : null;
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
      const initialPerfPortion = r.perfContribPct * r.salaryUsd * perfWeight;
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
      // Jon's model: IF(budget>1, InitPerf*(1-budget), InitPerf*(1/budget))
      // This gives the adjustment DELTA, not the full adjusted value
      const adjustedPerfPortion = budgetPct > 1
        ? r.initialPerfPortion * (1 - budgetPct)
        : budgetPct > 0
          ? r.initialPerfPortion * (1 / budgetPct)
          : r.initialPerfPortion;

      const tenureContribPct =
        r.is_active && r.eligible && r.initialPerfPortion > 0 && totalTenureEligible > 0
          ? r.tenure / totalTenureEligible
          : 0;
      const tenurePortion = tenureContribPct * tenureAllocation;

      // Final = adjustment delta + tenure (NOT initPerf + tenure)
      const initialPoolUsd = r.initialPerfPortion + tenurePortion;
      const salaryCap = r.salaryUsd * 0.05;
      const uncappedPoolUsd = adjustedPerfPortion + tenurePortion;
      const hasOverride = r.final_pool_override_usd != null;
      const finalPoolUsd = hasOverride
        ? Math.min(parseFloat(r.final_pool_override_usd), salaryCap)
        : Math.min(uncappedPoolUsd, salaryCap);
      const capped = (hasOverride ? parseFloat(r.final_pool_override_usd) : uncappedPoolUsd) > salaryCap;
      const finalPoolLcy = usdToLcy(finalPoolUsd, r.currency, fxRates);

      const eoyCompUsd = r.salaryUsd + r.bonusUsd + r.spotUsd + finalPoolUsd;
      const eoyCompLcy = usdToLcy(eoyCompUsd, r.currency, fxRates);
      const eoyBonusPct = r.salaryUsd > 0 ? finalPoolUsd / r.salaryUsd : 0;

      return {
        ...r,
        adjustedPerfPortion,
        tenureContribPct,
        tenurePortion,
        initialPoolUsd,
        finalPoolUsd,
        finalPoolLcy,
        salaryCap,
        capped,
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
  }, [data, fxRates]);

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
  const isSealed = config.status === 'sealed';

  const thBase = 'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide border border-white/5 whitespace-nowrap text-gray-400';
  const tdBase = 'px-2 py-1 text-xs border border-white/5 whitespace-nowrap';
  const inputBase = `no-spinner border border-white/10 rounded px-1.5 py-0.5 w-full bg-white/5 text-xs text-white focus:ring-1 focus:ring-nano-blue/50 focus:border-nano-blue/50 focus:outline-none ${isSealed ? 'opacity-60 cursor-not-allowed' : ''}`;
  const stickyBg = { backgroundColor: '#111827' };
  const stickyBgHeader = { backgroundColor: '#1a2332' };
  const stickyShadow = { backgroundColor: '#111827', boxShadow: '2px 0 4px rgba(0,0,0,0.3)' };
  const stickyShadowHeader = { backgroundColor: '#1a2332', boxShadow: '2px 0 4px rgba(0,0,0,0.3)' };
  const calcCell = 'bg-white/[0.02] text-gray-400';

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        {isSealed && (
          <div className="flex items-center gap-2 text-sm text-green-400 font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Sealed — values are locked
          </div>
        )}
        {!isSealed && <div />}
        <div className="flex gap-3">
          <button
            onClick={handleToggleSeal}
            className={`flex items-center gap-2 text-sm py-2 px-4 rounded-xl border font-bold transition-all duration-300 ${
              isSealed
                ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSealed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
            {isSealed ? 'Unseal' : 'Seal'}
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(prev => !prev)}
              disabled={exporting}
              className="btn-neon-secondary flex items-center gap-2 text-sm py-2 px-4"
            >
              {exporting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Export
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-nano-purple/20 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-nano-purple/20 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 4v16M15 4v16" />
                  </svg>
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Main Table */}
      <div className="glass-card overflow-hidden" style={{background: '#111827', backdropFilter: 'none', WebkitBackdropFilter: 'none'}}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap text-gray-300 border-collapse">
            <thead>
              {/* Section headers row */}
              <tr>
                <th colSpan={5} className={`${thBase} bg-white/5 text-gray-300 text-center`}>Employee</th>
                <th colSpan={10} className={`${thBase} bg-nano-blue/20 text-nano-blue text-center`}>Beginning of Year Compensation</th>
                <th colSpan={3} className={`${thBase} bg-banano-yellow/15 text-banano-yellow text-center`}>Midyear / Spot Bonus</th>
                <th colSpan={11} className={`${thBase} bg-nano-purple/20 text-nano-purple text-center`}>Pickup Bonus Pool</th>
                <th colSpan={3} className={`${thBase} bg-rose-500/15 text-rose-400 text-center`}>End of Year Comp</th>
              </tr>
              {/* Column headers row */}
              <tr>
                {/* Delete action */}
                <th className={`${thBase} sticky left-0 z-20 w-6`} style={stickyBgHeader} />
                {/* Employee */}
                <th className={`${thBase} sticky left-6 z-20 min-w-[140px]`} style={stickyShadowHeader}>Resource</th>
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
                <th className={`${thBase} bg-nano-purple/5`}>Pool % Sal</th>
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
                  <tr key={r.id} className={`${rowCls} hover:bg-white/5 transition-colors group`}>
                    {/* Delete button */}
                    <td className={`${tdBase} w-6 text-center sticky left-0 z-10`} style={stickyBg}>
                      <button
                        onClick={() => handleDeleteEmployee(r.id)}
                        title="Remove row"
                        disabled={isSealed}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                    {/* Employee */}
                    <td className={`${tdBase} font-medium text-white sticky left-6 z-10 min-w-[140px]`} style={stickyShadow}>{r.resource_name}</td>
                    <td className={tdBase}>{r.title || '-'}</td>
                    <td className={tdBase}>
                      <input
                        type="text"
                        defaultValue={fmtDate(r.join_date)}
                        placeholder="m/d/yy"
                        onBlur={e => {
                          const iso = parseMdyy(e.target.value);
                          if (iso && iso !== (r.join_date || '').split('T')[0]) {
                            updateEmployee(r.id, 'hire_date_override', iso);
                          }
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        className={`${inputBase} w-20 text-center`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{r.tenure.toFixed(1)}</td>
                    {/* BOY Comp */}
                    <td className={tdBase}>
                      <input
                        type="number"
                        value={r.totalCompLcy}
                        onChange={e => updateEmployee(r.id, 'total_comp_lcy', parseInt(e.target.value) || 0)}
                        className={`${inputBase} w-28 text-right`}
                      />
                    </td>
                    <td className={tdBase}>
                      <select
                        value={r.currency}
                        onChange={e => updateEmployee(r.id, 'lcy_currency', e.target.value)}
                        className={inputBase}
                        style={{ minWidth: '5rem' }}
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
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={r.rating != null ? parseFloat(r.rating).toFixed(2) : ''}
                        onChange={e => updateEmployee(r.id, 'rating', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="-"
                        className={`${inputBase} w-14 text-center`}
                      />
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
                    <td className={`${tdBase} text-right ${r.capped ? 'text-red-400' : ''}`}>
                      <input
                        type="number"
                        value={Math.round(r.finalPoolUsd)}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          updateEmployee(r.id, 'final_pool_override_usd', val);
                        }}
                        className={`${inputBase} w-20 text-right`}
                        title={r.capped ? `Capped at 5% of salary (${fmtUsd(r.salaryCap)})` : ''}
                      />
                    </td>
                    <td className={`${tdBase} text-right ${r.capped ? 'text-red-400' : ''}`}>
                      <input
                        type="number"
                        value={Math.round(r.finalPoolLcy)}
                        onChange={e => {
                          const lcy = parseFloat(e.target.value) || 0;
                          const usd = fxToUsd(lcy, r.currency, fxRates);
                          updateEmployee(r.id, 'final_pool_override_usd', usd);
                        }}
                        className={`${inputBase} w-20 text-right`}
                      />
                    </td>
                    <td className={`${tdBase} ${calcCell} text-right ${r.salaryLcy > 0 && r.finalPoolLcy / r.salaryLcy > 0.05 ? 'text-red-400' : ''}`}>
                      {r.salaryLcy > 0 ? fmtPct(r.finalPoolLcy / r.salaryLcy) : '-'}
                    </td>
                    {/* EOY */}
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmt(r.eoyCompLcy)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtUsd(r.eoyCompUsd)}</td>
                    <td className={`${tdBase} ${calcCell} text-right`}>{fmtPct(r.eoyBonusPct)}</td>
                  </tr>
                );
              })}
              {/* Inline add row */}
              {newRowActive ? (
                <tr className="bg-nano-purple/5">
                  <td className={`${tdBase} w-6 text-center sticky left-0 z-10`} style={stickyBg}>
                    <button
                      onClick={handleCancelNewRow}
                      title="Cancel"
                      className="text-gray-500 hover:text-red-400 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                  <td className={`${tdBase} sticky left-6 z-10`} style={stickyShadow}>
                    <input
                      ref={newRowInputRef}
                      type="text"
                      value={newRowSearch}
                      onChange={e => {
                        setNewRowSearch(e.target.value);
                        setDropdownOpen(e.target.value.length >= 2);
                      }}
                      onFocus={() => { if (newRowSearch.length >= 2) setDropdownOpen(true); }}
                      onKeyDown={e => { if (e.key === 'Escape') handleCancelNewRow(); }}
                      placeholder="Type name or email…"
                      className={`${inputBase} w-40`}
                    />
                  </td>
                  <td className={`${tdBase} text-gray-500 text-[10px]`} colSpan={29}>Select an employee from the dropdown to add a row</td>
                </tr>
              ) : (
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className={`${tdBase} w-6 text-center sticky left-0 z-10`} style={stickyBg}>
                    <button
                      onClick={handleStartNewRow}
                      title="Add employee"
                      className="text-gray-600 hover:text-nano-purple transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </td>
                  <td className={`${tdBase} text-gray-600 text-[10px]`} colSpan={30} />
                </tr>
              )}
              {/* Totals row */}
              {rows.length > 0 && (
                <tr className="font-bold border-t-2 border-white/10 bg-white/5 text-white">
                  <td className={`${tdBase} sticky left-0 z-10`} style={stickyBgHeader} />
                  <td className={`${tdBase} font-bold text-white sticky left-6 z-10`} style={stickyShadowHeader}>Totals</td>
                  <td className={tdBase} />
                  <td className={tdBase} />
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmt(totals.totalCompLcy)}</td>
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.totalCompUsd)}</td>
                  <td className={`${tdBase} text-right`}>{fmt(totals.salaryLcy)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.salaryUsd)}</td>
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmt(totals.bonusLcy)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.bonusUsd)}</td>
                  <td className={`${tdBase} text-right`}>{fmt(totals.signOnLcy)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.signOnUsd)}</td>
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmt(totals.spotLcy)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.spotUsd)}</td>
                  <td className={tdBase} />
                  <td className={tdBase} />
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.initialPerfPortion)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.adjustedPerfPortion)}</td>
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.tenurePortion)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.initialPoolUsd)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.finalPoolUsd)}</td>
                  <td className={`${tdBase} text-right`}>{fmt(totals.finalPoolLcy)}</td>
                  <td className={tdBase} />
                  <td className={`${tdBase} text-right`}>{fmt(totals.eoyCompLcy)}</td>
                  <td className={`${tdBase} text-right`}>{fmtUsd(totals.eoyCompUsd)}</td>
                  <td className={tdBase} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-gray-400 px-3 py-1.5 bg-gray-900">
          *Excludes contractors and ineligible employees from pool calculations
        </p>
      </div>

      {/* Dropdown rendered with fixed position — outside the overflow container */}
      {dropdownOpen && filteredTsUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-72 max-h-48 overflow-y-auto bg-gray-900 border border-white/10 rounded-lg shadow-2xl"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {filteredTsUsers.map(u => (
            <button
              key={u.id}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelectUser(u)}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-nano-purple/20 hover:text-white transition-colors flex items-center justify-between"
            >
              <span className="font-medium">{u.name}</span>
              <span className="text-[10px] text-gray-500 ml-2">{u.email}</span>
            </button>
          ))}
        </div>
      )}
      {dropdownOpen && newRowSearch.length >= 2 && filteredTsUsers.length === 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-[100] w-72 bg-gray-900 border border-white/10 rounded-lg shadow-2xl px-3 py-3"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <p className="text-[10px] text-gray-500">No matching users</p>
        </div>
      )}

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
                    <td className="px-3 py-1.5 border-t border-white/5 text-right">
                      <input
                        type="number"
                        value={Math.round(m.profitSharePool)}
                        onChange={e => {
                          const newPool = parseFloat(e.target.value) || 0;
                          const newPct = bonusAllocation > 0 ? newPool / bonusAllocation : 0;
                          updateMilestonePct(m.id, newPct);
                        }}
                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 w-24 text-right text-xs text-white focus:ring-1 focus:ring-nano-blue/50 focus:outline-none"
                      />
                    </td>
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
                  {['milestone2_pct', 'milestone3_pct', 'milestone4_pct'].map(field => (
                    <td key={field} className="px-3 py-1.5 border-t border-white/5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={((parseFloat(g[field]) || 0) * 100).toFixed(2)}
                        onChange={e => updateGuidanceRange(g.id, field, (parseFloat(e.target.value) || 0) / 100)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 w-16 text-right text-xs text-white focus:ring-1 focus:ring-nano-blue/50 focus:outline-none"
                      />
                    </td>
                  ))}
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
