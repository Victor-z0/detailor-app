"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  DollarSign, Calendar, TrendingUp, Users, ArrowUpRight,
  ArrowDownRight, Download, Clock, Star, Repeat, Target,
  BarChart2, RefreshCw, ChevronDown,
} from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SERVICE_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];

type Range = '7d'|'30d'|'90d'|'all'|'Q1'|'Q2'|'Q3'|'Q4';

function StatCard({ icon: Icon, label, value, sub, color, trend }: any) {
  const isUp = trend > 0;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.bg}`}>
          <Icon size={16} className={color.text}/>
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {isUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-black ${color.text}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [range,        setRange]        = useState<Range>('30d');
  const [showRange,    setShowRange]    = useState(false);
  const [exporting,    setExporting]    = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('scheduled_time', { ascending: true });
      setAppointments(data || []);
      setLoading(false);
    });
  }, []);

  const getRange = useCallback((): { start: Date; end: Date } => {
    const now = new Date();
    if (range === 'all') return { start: new Date(0), end: now };
    if (['Q1','Q2','Q3','Q4'].includes(range)) {
      const q = ['Q1','Q2','Q3','Q4'].indexOf(range);
      const year = now.getFullYear();
      return { start: new Date(year, q*3, 1), end: new Date(year, q*3+3, 0, 23, 59, 59) };
    }
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    return { start: new Date(now.getTime() - days*86400000), end: now };
  }, [range]);

  const { start, end } = getRange();
  const rangeApts = appointments.filter(a => {
    const d = new Date(a.scheduled_time);
    return d >= start && d <= end;
  });
  const completed = rangeApts.filter(a => a.status === 'Completed');
  const revenue   = completed.reduce((s, a) => s + Number(a.total_price || 0), 0);
  const avgTicket = completed.length ? Math.round(revenue / completed.length) : 0;

  // Retention: clients with 2+ visits
  const clientVisits = new Map<string, number>();
  for (const a of appointments) {
    const k = a.customer_phone || a.customer_email || a.customer_name;
    if (k) clientVisits.set(k, (clientVisits.get(k) || 0) + 1);
  }
  const returningClients = Array.from(clientVisits.values()).filter(v => v >= 2).length;
  const retentionRate    = clientVisits.size > 0 ? Math.round((returningClients / clientVisits.size) * 100) : 0;

  // Revenue chart — by week or month
  const revenueChart = (() => {
    const buckets = new Map<string, number>();
    for (const a of completed) {
      const d   = new Date(a.scheduled_time);
      const key = range === '7d'
        ? d.toLocaleDateString('en-US',{weekday:'short'})
        : `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      buckets.set(key, (buckets.get(key) || 0) + Number(a.total_price || 0));
    }
    return Array.from(buckets.entries()).map(([name, revenue]) => ({ name, revenue }));
  })();

  // Appointment volume chart (all statuses)
  const volumeChart = (() => {
    const b = new Map<string, number>();
    for (const a of rangeApts) {
      const d = new Date(a.scheduled_time);
      const k = `${MONTH_NAMES[d.getMonth()]}`;
      b.set(k, (b.get(k) || 0) + 1);
    }
    return Array.from(b.entries()).map(([name, count]) => ({ name, count }));
  })();

  // Service popularity
  const svcMap = new Map<string, { count: number; revenue: number }>();
  for (const a of rangeApts) {
    const s = a.service_type || a.service_name || 'Other';
    const x = svcMap.get(s) || { count: 0, revenue: 0 };
    svcMap.set(s, { count: x.count + 1, revenue: x.revenue + Number(a.total_price || 0) });
  }
  const serviceStats = Array.from(svcMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
  const topService = serviceStats[0];

  // Client retention pie
  const retentionPie = [
    { name: 'Returning', value: returningClients },
    { name: 'New',       value: Math.max(0, clientVisits.size - returningClients) },
  ];

  // Status breakdown
  const statusMap = new Map<string, number>();
  for (const a of rangeApts) statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1);
  const statusPie = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  const STATUS_PIE_COLORS: Record<string, string> = {
    Completed: '#10b981', 'In-Progress': '#3b82f6', Confirmed: '#8b5cf6',
    Cancelled: '#ef4444', 'Pending Payment': '#f59e0b',
  };

  // Export CSV
  function exportCSV() {
    setExporting(true);
    const headers = ['Date','Client','Service','Vehicle','Price','Status'];
    const rows = appointments.map(a => [
      new Date(a.scheduled_time).toLocaleDateString(),
      a.customer_name || '',
      a.service_type || a.service_name || '',
      a.vehicle_info || a.vehicle_make_model || '',
      a.total_price || '',
      a.status || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `detailor-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (loading) return <div className="flex items-center justify-center py-32"><RefreshCw size={20} className="text-gray-300 animate-spin"/></div>;

  const RANGE_LABELS: Record<Range, string> = {
    '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days',
    'all': 'All time', 'Q1': 'Q1', 'Q2': 'Q2', 'Q3': 'Q3', 'Q4': 'Q4',
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range picker */}
          <div className="relative">
            <button onClick={() => setShowRange(!showRange)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-200 transition-colors">
              <Calendar size={14} className="text-gray-400"/>
              {RANGE_LABELS[range]}
              <ChevronDown size={13} className="text-gray-400"/>
            </button>
            {showRange && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 w-44">
                {(Object.entries(RANGE_LABELS) as [Range, string][]).map(([k, v]) => (
                  <button key={k} onClick={() => { setRange(k); setShowRange(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${range === k ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-200 transition-colors disabled:opacity-50">
            {exporting ? <RefreshCw size={14} className="animate-spin"/> : <Download size={14}/>}
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue"   value={`$${revenue.toLocaleString()}`}     color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} trend={12}/>
        <StatCard icon={Calendar}   label="Jobs Completed"  value={completed.length}                    color={{ bg: 'bg-blue-50',    text: 'text-blue-600'    }} trend={8}/>
        <StatCard icon={Target}     label="Avg. Ticket"     value={`$${avgTicket}`}                     color={{ bg: 'bg-violet-50',  text: 'text-violet-600'  }} trend={-3}/>
        <StatCard icon={Repeat}     label="Retention Rate"  value={`${retentionRate}%`} sub={`${returningClients} returning`} color={{ bg: 'bg-amber-50', text: 'text-amber-600' }} trend={5}/>
      </div>

      {/* REVENUE CHART */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Revenue Over Time</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completed jobs only</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">${revenue.toLocaleString()} total</span>
        </div>
        {revenueChart.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-300">No completed jobs in this range</div>
        ) : (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }}/>
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SERVICE + VOLUME CHARTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Service popularity */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Service Profitability</h3>
          <p className="text-xs text-gray-400 mb-4">Revenue and volume by service type</p>
          {serviceStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-300">No data yet</div>
          ) : (
            <div className="space-y-3">
              {serviceStats.slice(0,6).map((s, i) => {
                const maxRev = serviceStats[0].revenue || 1;
                const pct    = Math.round((s.revenue / maxRev) * 100);
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate mr-2">{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{s.count} jobs</span>
                        <span className="text-xs font-bold text-gray-900">${s.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointment volume */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Appointment Volume</h3>
          <p className="text-xs text-gray-400 mb-4">All appointments by month</p>
          {volumeChart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-300">No data yet</div>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px' }}/>
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* RETENTION + STATUS PIE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Retention pie */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Customer Retention</h3>
          <p className="text-xs text-gray-400 mb-4">New vs returning clients</p>
          <div className="flex items-center gap-6">
            <div className="h-36 w-36 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={retentionPie} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value">
                    <Cell fill="#3b82f6"/>
                    <Cell fill="#e5e7eb"/>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-black text-blue-600">{retentionRate}%</p>
                <p className="text-xs text-gray-400">retention rate</p>
              </div>
              <div className="space-y-1.5">
                {retentionPie.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#3b82f6' : '#e5e7eb' }}/>
                    <span className="text-xs text-gray-600">{p.name}: <strong>{p.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Job Status Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution across all statuses</p>
          {statusPie.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-300">No data</div>
          ) : (
            <div className="space-y-2.5">
              {statusPie.map(s => {
                const total = rangeApts.length || 1;
                const pct   = Math.round((s.value / total) * 100);
                const color = STATUS_PIE_COLORS[s.name] || '#9ca3af';
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}/>
                        <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{s.value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TOP METRICS SUMMARY */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4">Growth Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Star,     label: 'Top Service',     value: topService?.name || '—',            sub: topService ? `$${topService.revenue.toLocaleString()} revenue` : '', color: 'text-amber-600' },
            { icon: Users,    label: 'Total Clients',   value: clientVisits.size,                   sub: `${returningClients} returning`,        color: 'text-blue-600'    },
            { icon: Clock,    label: 'Busiest Month',   value: volumeChart.sort((a,b) => b.count - a.count)[0]?.name || '—', sub: `${volumeChart[0]?.count || 0} jobs`, color: 'text-violet-600' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <m.icon size={20} className={m.color}/>
              <div>
                <p className="text-xs text-gray-400 font-semibold">{m.label}</p>
                <p className="text-sm font-black text-gray-900">{m.value}</p>
                {m.sub && <p className="text-[10px] text-gray-400">{m.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}