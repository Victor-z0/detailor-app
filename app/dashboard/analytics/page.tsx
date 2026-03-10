"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  DollarSign, Calendar, TrendingUp, Users, ArrowUpRight,
  ArrowDownRight, Download, ChevronDown, Clock, Star,
  Repeat, Target, BarChart2
} from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS: Record<string, string> = {
  Completed: '#10b981', 'In-Progress': '#3b82f6',
  Confirmed: '#8b5cf6', Cancelled: '#ef4444', 'Pending Payment': '#f59e0b',
};

type RangeMode = 'custom' | '7d' | '30d' | '90d' | 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

function getQuarterRange(q: 'Q1'|'Q2'|'Q3'|'Q4') {
  const year = new Date().getFullYear();
  const starts = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 };
  const start = new Date(year, starts[q], 1);
  const end   = new Date(year, starts[q] + 3, 0, 23, 59, 59);
  return { start, end };
}

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [rangeMode, setRangeMode]       = useState<RangeMode>('30d');
  const [showPicker, setShowPicker]     = useState(false);
  const [customStart, setCustomStart]   = useState('');
  const [customEnd, setCustomEnd]       = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('scheduled_time', { ascending: true });
      setAppointments(data || []);
      setLoading(false);
    });
  }, []);

  // ── Date range helpers ──────────────────────────────────────────────
  const getRange = useCallback((): { start: Date; end: Date } => {
    const now = new Date();
    if (rangeMode === 'Q1') return getQuarterRange('Q1');
    if (rangeMode === 'Q2') return getQuarterRange('Q2');
    if (rangeMode === 'Q3') return getQuarterRange('Q3');
    if (rangeMode === 'Q4') return getQuarterRange('Q4');
    if (rangeMode === 'custom' && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd + 'T23:59:59') };
    }
    if (rangeMode === 'all') return { start: new Date(0), end: now };
    const days = rangeMode === '7d' ? 7 : rangeMode === '90d' ? 90 : 30;
    return { start: new Date(now.getTime() - days * 86400000), end: now };
  }, [rangeMode, customStart, customEnd]);

  const getPrevRange = useCallback((): { start: Date; end: Date } | null => {
    const { start, end } = getRange();
    if (rangeMode === 'all') return null;
    const span = end.getTime() - start.getTime();
    return { start: new Date(start.getTime() - span), end: new Date(start.getTime() - 1) };
  }, [getRange, rangeMode]);

  const { start: rStart, end: rEnd } = getRange();
  const prevRange = getPrevRange();

  const filtered = appointments.filter(a => {
    const t = new Date(a.scheduled_time).getTime();
    return t >= rStart.getTime() && t <= rEnd.getTime();
  });
  const prev = prevRange
    ? appointments.filter(a => {
        const t = new Date(a.scheduled_time).getTime();
        return t >= prevRange.start.getTime() && t <= prevRange.end.getTime();
      })
    : [];

  // ── Metrics ─────────────────────────────────────────────────────────
  const completed     = filtered.filter(a => a.status === 'Completed');
  const totalRevenue  = completed.reduce((s, a) => s + (Number(a.total_price) || 0), 0);
  const prevRevenue   = prev.filter(a => a.status === 'Completed').reduce((s, a) => s + (Number(a.total_price) || 0), 0);
  const totalJobs     = filtered.length;
  const prevJobs      = prev.length;
  const avgJobValue   = completed.length > 0 ? totalRevenue / completed.length : 0;
  const uniqueClients = new Set(filtered.map(a => a.customer_email || a.customer_phone).filter(Boolean)).size;
  const cancelRate    = totalJobs > 0 ? Math.round((filtered.filter(a => a.status === 'Cancelled').length / totalJobs) * 100) : 0;
  const completionRate = totalJobs > 0 ? Math.round((completed.length / totalJobs) * 100) : 0;

  const pct = (cur: number, pre: number) => pre > 0 ? Math.round(((cur - pre) / pre) * 100) : null;
  const revPct = pct(totalRevenue, prevRevenue);
  const jobPct = pct(totalJobs, prevJobs);

  // ── Revenue chart (daily buckets) ────────────────────────────────────
  const revenueChart = (() => {
    const spanDays = Math.min(Math.ceil((rEnd.getTime() - rStart.getTime()) / 86400000), 60);
    const buckets: Record<string, number> = {};
    for (let i = 0; i < spanDays; i++) {
      const d = new Date(rStart.getTime() + i * 86400000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    completed.forEach(a => {
      const key = new Date(a.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in buckets) buckets[key] += Number(a.total_price) || 0;
    });
    return Object.entries(buckets).map(([date, revenue]) => ({ date, revenue }));
  })();

  // ── Monthly revenue (this year) ──────────────────────────────────────
  const monthlyRevenue = MONTH_NAMES.map((name, i) => {
    const year = new Date().getFullYear();
    const rev = appointments
      .filter(a => a.status === 'Completed')
      .filter(a => { const d = new Date(a.scheduled_time); return d.getFullYear() === year && d.getMonth() === i; })
      .reduce((s, a) => s + (Number(a.total_price) || 0), 0);
    return { name, revenue: rev };
  });

  // ── Top services ─────────────────────────────────────────────────────
  const topServices = (() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach(a => {
      const n = a.service_type || a.service_name || 'Unknown';
      if (!map[n]) map[n] = { count: 0, revenue: 0 };
      map[n].count++;
      if (a.status === 'Completed') map[n].revenue += Number(a.total_price) || 0;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  })();

  // ── Busiest days ─────────────────────────────────────────────────────
  const busiestDays = DAY_NAMES.map((name, i) => ({
    name, count: filtered.filter(a => new Date(a.scheduled_time).getDay() === i).length
  }));

  // ── Status breakdown for pie ─────────────────────────────────────────
  const statusBreakdown = ['Completed','In-Progress','Confirmed','Cancelled','Pending Payment'].map(status => ({
    name: status,
    value: filtered.filter(a => a.status === status).length,
    color: STATUS_COLORS[status],
  })).filter(s => s.value > 0);

  // ── Repeat vs new clients ────────────────────────────────────────────
  const allPrevClients = new Set(
    appointments
      .filter(a => new Date(a.scheduled_time).getTime() < rStart.getTime())
      .map(a => a.customer_email || a.customer_phone).filter(Boolean)
  );
  const repeatClients = filtered.filter(a => allPrevClients.has(a.customer_email || a.customer_phone)).length;
  const newClients    = filtered.filter(a => !allPrevClients.has(a.customer_email || a.customer_phone)).length;

  // ── Export CSV ───────────────────────────────────────────────────────
  function exportCSV() {
    const headers = ['Date','Customer','Service','Status','Amount'];
    const rows = filtered.map(a => [
      new Date(a.scheduled_time).toLocaleDateString(),
      a.customer_name || '',
      a.service_type || a.service_name || '',
      a.status || '',
      a.total_price || '0',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `analytics-${rangeMode}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const rangeLabel = () => {
    if (rangeMode === 'all') return 'All Time';
    if (rangeMode === 'custom') return customStart && customEnd ? `${customStart} – ${customEnd}` : 'Custom Range';
    return { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', 'Q1': `Q1 ${new Date().getFullYear()}`, 'Q2': `Q2 ${new Date().getFullYear()}`, 'Q3': `Q3 ${new Date().getFullYear()}`, 'Q4': `Q4 ${new Date().getFullYear()}` }[rangeMode] ?? rangeMode;
  };

  const Trend = ({ p }: { p: number | null }) => {
    if (p === null) return null;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${p >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
        {p >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(p)}%
      </span>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">{rangeLabel()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">

          {/* Quarter buttons - hidden on xs, shown sm+ */}
          {(['Q1','Q2','Q3','Q4'] as const).map(q => (
            <button key={q} onClick={() => setRangeMode(q)}
              className={`hidden sm:block px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${rangeMode === q ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'}`}>
              {q}
            </button>
          ))}

          {/* Range dropdown */}
          <div className="relative">
            <button onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Calendar size={13} />
              {!['Q1','Q2','Q3','Q4'].includes(rangeMode) ? rangeLabel() : 'Range'}
              <ChevronDown size={12} />
            </button>
            {showPicker && (
              <div className="absolute right-0 top-11 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
                {(['7d','30d','90d','all'] as const).map(r => (
                  <button key={r} onClick={() => { setRangeMode(r); setShowPicker(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${rangeMode === r ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
                    {{ '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', all: 'All Time' }[r]}
                  </button>
                ))}
                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-400">Custom Range</p>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                  <button onClick={() => { if (customStart && customEnd) { setRangeMode('custom'); setShowPicker(false); } }}
                    className="w-full bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <Download size={13} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',    value: `$${totalRevenue.toLocaleString()}`,  change: revPct, icon: <DollarSign size={18} className="text-blue-600"   />, bg: 'bg-blue-50'   },
          { label: 'Total Jobs',       value: totalJobs,                             change: jobPct, icon: <Calendar  size={18} className="text-violet-600" />, bg: 'bg-violet-50' },
          { label: 'Avg. Job Value',   value: `$${avgJobValue.toFixed(0)}`,          change: null,   icon: <TrendingUp size={18} className="text-emerald-600"/>, bg: 'bg-emerald-50' },
          { label: 'Unique Clients',   value: uniqueClients,                         change: null,   icon: <Users     size={18} className="text-orange-500" />, bg: 'bg-orange-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>{s.icon}</div>
              <Trend p={s.change} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completion Rate', value: `${completionRate}%`,   icon: <Target    size={16} className="text-emerald-600"/>, bg: 'bg-emerald-50', sub: `${completed.length} of ${totalJobs} jobs` },
          { label: 'Cancellation Rate',value: `${cancelRate}%`,      icon: <BarChart2 size={16} className="text-red-500"    />, bg: 'bg-red-50',     sub: `${filtered.filter(a=>a.status==='Cancelled').length} cancelled` },
          { label: 'Repeat Clients',   value: repeatClients,          icon: <Repeat    size={16} className="text-blue-600"   />, bg: 'bg-blue-50',    sub: `${newClients} new this period` },
          { label: 'Avg Daily Revenue',value: `$${revenueChart.length > 0 ? Math.round(totalRevenue / Math.max(revenueChart.length,1)) : 0}`, icon: <DollarSign size={16} className="text-violet-600"/>, bg: 'bg-violet-50', sub: 'per active day' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* REVENUE OVER TIME */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Revenue Over Time</h2>
            <p className="text-xs text-gray-400 mt-0.5">Completed jobs · {rangeLabel()}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
        </div>
        {revenueChart.some(d => d.revenue > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={Math.floor(revenueChart.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-300">No revenue data for this period</p>
          </div>
        )}
      </div>

      {/* MONTHLY REVENUE + BUSIEST DAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Monthly Revenue ({new Date().getFullYear()})</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {monthlyRevenue.map((_, i) => <Cell key={i} fill={i === new Date().getMonth() ? '#2563eb' : '#e0e7ff'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Busiest Days</h2>
          {busiestDays.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={busiestDays} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(v: any) => [v, 'Jobs']} contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {busiestDays.map((e, i) => <Cell key={i} fill={e.count === Math.max(...busiestDays.map(d => d.count)) ? '#2563eb' : '#e0e7ff'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[180px] flex items-center justify-center bg-gray-50 rounded-xl"><p className="text-sm text-gray-300">No data yet</p></div>}
        </div>
      </div>

      {/* TOP SERVICES + STATUS PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Top Services</h2>
          {topServices.length === 0
            ? <p className="text-center text-sm text-gray-300 py-8">No data yet</p>
            : <div className="space-y-4">
                {topServices.map((svc, i) => {
                  const pct = Math.round((svc.revenue / (topServices[0].revenue || 1)) * 100);
                  return (
                    <div key={svc.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                          <span className="text-sm font-semibold text-gray-800">{svc.name}</span>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900">${svc.revenue.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-2">{svc.count}x</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Job Status</h2>
          {statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {statusBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v + ' jobs', n]} contentStyle={{ border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusBreakdown.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-[140px] flex items-center justify-center bg-gray-50 rounded-xl"><p className="text-sm text-gray-300">No data yet</p></div>}
        </div>
      </div>

      {/* RECENT JOBS */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Jobs</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} jobs in period</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0
            ? <div className="py-12 text-center text-sm text-gray-300">No jobs in this period</div>
            : [...filtered].sort((a,b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()).slice(0,8).map(apt => (
              <div key={apt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {apt.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{apt.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{apt.service_type || apt.service_name}</p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                  {new Date(apt.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">${apt.total_price || '—'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full`}
                    style={{ background: `${STATUS_COLORS[apt.status] || '#6b7280'}20`, color: STATUS_COLORS[apt.status] || '#6b7280' }}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}