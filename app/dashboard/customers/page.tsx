"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Phone, Car, Mail, Star, Shield, Zap, Users,
  DollarSign, X, Calendar, TrendingUp, MessageSquare,
  Plus, Edit3, Save, RefreshCw, ChevronRight, Clock,
  StickyNote, Filter, ArrowUpDown, User,
} from 'lucide-react';

const TIER_CONFIG = {
  VIP:     { cls: 'bg-violet-50 text-violet-700 border border-violet-100', icon: Shield,  threshold: 1500 },
  Regular: { cls: 'bg-blue-50 text-blue-700 border border-blue-100',       icon: Star,    threshold: 500  },
  New:     { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100', icon: Zap,  threshold: 0    },
};

function getTier(spent: number) {
  if (spent >= 1500) return 'VIP';
  if (spent >= 500)  return 'Regular';
  return 'New';
}

export default function CustomersPage() {
  const [customers,    setCustomers]    = useState<any[]>([]);
  const [allApts,      setAllApts]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState<any | null>(null);
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState<'name'|'spent'|'visits'|'last'>('last');
  const [filterTier,   setFilterTier]   = useState<string>('All');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue,   setNotesValue]   = useState('');
  const [prefValue,    setPrefValue]    = useState('');
  const [savingNotes,  setSavingNotes]  = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('scheduled_time', { ascending: false });
    const apts = data || [];
    setAllApts(apts);

    // Build unique customer profiles
    const map = new Map<string, any>();
    for (const apt of apts) {
      const key = apt.customer_phone || apt.customer_email || apt.customer_name;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          id:           key,
          customer_name:  apt.customer_name,
          customer_phone: apt.customer_phone || '',
          customer_email: apt.customer_email || '',
          total_spent:    0,
          visit_count:    0,
          last_visit:     apt.scheduled_time,
          first_visit:    apt.scheduled_time,
          vehicles:       [],
          services:       [],
          notes:          apt.customer_notes || '',
          preferences:    apt.customer_preferences || '',
        });
      }
      const c = map.get(key);
      c.total_spent += Number(apt.total_price || 0);
      c.visit_count  += 1;
      if (new Date(apt.scheduled_time) > new Date(c.last_visit)) c.last_visit = apt.scheduled_time;
      if (new Date(apt.scheduled_time) < new Date(c.first_visit)) c.first_visit = apt.scheduled_time;
      const v = apt.vehicle_info || apt.vehicle_make_model;
      if (v && !c.vehicles.includes(v)) c.vehicles.push(v);
      const s = apt.service_type || apt.service_name;
      if (s && !c.services.includes(s)) c.services.push(s);
    }
    setCustomers(Array.from(map.values()));
    setLoading(false);
  }

  async function saveNotes(customerId: string) {
    setSavingNotes(true);
    // Update all appointments for this customer with new notes/preferences
    await supabase.from('appointments').update({
      customer_notes: notesValue,
      customer_preferences: prefValue,
    }).or(`customer_phone.eq.${customerId},customer_email.eq.${customerId},customer_name.eq.${customerId}`);
    setCustomers(cs => cs.map(c => c.id === customerId ? { ...c, notes: notesValue, preferences: prefValue } : c));
    setSelected((s: any) => s ? { ...s, notes: notesValue, preferences: prefValue } : null);
    setSavingNotes(false);
    setEditingNotes(false);
  }

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'spent')  return b.total_spent - a.total_spent;
    if (sortBy === 'visits') return b.visit_count - a.visit_count;
    if (sortBy === 'name')   return a.customer_name.localeCompare(b.customer_name);
    return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
  });

  const filtered = sorted.filter(c => {
    const q = search.toLowerCase();
    const matchQ = (c.customer_name?.toLowerCase() || '').includes(q) ||
                   (c.customer_phone || '').includes(q) ||
                   (c.customer_email?.toLowerCase() || '').includes(q) ||
                   c.vehicles.some((v: string) => v.toLowerCase().includes(q));
    const tier = getTier(c.total_spent);
    return matchQ && (filterTier === 'All' || tier === filterTier);
  });

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const vipCount     = customers.filter(c => getTier(c.total_spent) === 'VIP').length;
  const avgSpend     = customers.length ? Math.round(totalRevenue / customers.length) : 0;

  const customerHistory = selected
    ? allApts.filter(a => {
        const key = selected.customer_phone || selected.customer_email || selected.customer_name;
        return a.customer_phone === key || a.customer_email === key || a.customer_name === key;
      }).sort((a,b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())
    : [];

  if (loading) return <div className="flex items-center justify-center py-32"><RefreshCw size={20} className="text-gray-300 animate-spin"/></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} total clients</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
          <Plus size={15}/> Add Customer
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients',  value: customers.length,           icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'VIP Clients',    value: vipCount,                   icon: Shield,     color: 'text-violet-600',  bg: 'bg-violet-50'  },
          { label: 'Avg. Spend',     value: `$${avgSpend}`,             icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Revenue',  value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
              <s.icon size={15} className={s.color}/>
            </div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTER + SORT */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email, vehicle..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All','VIP','Regular','New'].map(t => (
            <button key={t} onClick={() => setFilterTier(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterTier === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-500'}`}>
              {t}
            </button>
          ))}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="last">Last Visit</option>
            <option value="spent">Top Spend</option>
            <option value="visits">Most Visits</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* CUSTOMER LIST */}
      <div className={`grid gap-4 ${selected ? 'grid-cols-1 lg:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={28} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400">No customers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(c => {
                const tier    = getTier(c.total_spent);
                const T       = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
                const TIcon   = T.icon;
                const isActive = selected?.id === c.id;
                const daysSince = Math.floor((Date.now() - new Date(c.last_visit).getTime()) / 86400000);
                return (
                  <div key={c.id} onClick={() => { setSelected(c); setNotesValue(c.notes || ''); setPrefValue(c.preferences || ''); setEditingNotes(false); }}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50/50 ${isActive ? 'bg-blue-50/40' : ''}`}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                      {c.customer_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-gray-900 truncate">{c.customer_name}</p>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${T.cls}`}>
                          <TIcon size={8}/> {tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {c.customer_phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={9}/>{c.customer_phone}</span>}
                        {c.vehicles[0]    && <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[120px]"><Car size={9}/>{c.vehicles[0]}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-sm font-black text-gray-900">${c.total_spent.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{c.visit_count} visit{c.visit_count !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-gray-300">{daysSince}d ago</p>
                    </div>
                    <ChevronRight size={14} className={`text-gray-200 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`}/>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CUSTOMER DETAIL PANEL */}
        {selected && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-black">
                  {selected.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selected.customer_name}</p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${TIER_CONFIG[getTier(selected.total_spent) as keyof typeof TIER_CONFIG].cls}`}>
                    {getTier(selected.total_spent)}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={14}/></button>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Spent',   value: `$${selected.total_spent.toLocaleString()}`, color: 'text-emerald-600' },
                  { label: 'Visits',  value: selected.visit_count,                         color: 'text-blue-600'    },
                  { label: 'Days ago', value: Math.floor((Date.now() - new Date(selected.last_visit).getTime()) / 86400000), color: 'text-gray-700' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 bg-gray-50 rounded-xl">
                    <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="space-y-2">
                {selected.customer_phone && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <Phone size={13} className="text-gray-400"/><p className="text-sm text-gray-700">{selected.customer_phone}</p>
                    <a href={`tel:${selected.customer_phone}`} className="ml-auto text-xs font-semibold text-blue-600 hover:underline">Call</a>
                  </div>
                )}
                {selected.customer_email && (
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                    <Mail size={13} className="text-gray-400"/><p className="text-sm text-gray-700 truncate">{selected.customer_email}</p>
                  </div>
                )}
              </div>

              {/* Vehicles */}
              {selected.vehicles.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Vehicles</p>
                  <div className="space-y-1.5">
                    {selected.vehicles.map((v: string) => (
                      <div key={v} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                        <Car size={13} className="text-gray-400 flex-shrink-0"/><p className="text-sm text-gray-700">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services used */}
              {selected.services.length > 0 && (
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Services Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.services.map((s: string) => (
                      <span key={s} className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Preferences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><StickyNote size={9}/> Notes & Preferences</p>
                  <button onClick={() => setEditingNotes(!editingNotes)}
                    className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    <Edit3 size={10}/>{editingNotes ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={3}
                      placeholder="Notes about this client..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                    <textarea value={prefValue} onChange={e => setPrefValue(e.target.value)} rows={2}
                      placeholder="Preferences (e.g. prefers afternoon, no strong scents)..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                    <button onClick={() => saveNotes(selected.id)} disabled={savingNotes}
                      className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-blue-700 disabled:opacity-50">
                      {savingNotes ? <RefreshCw size={11} className="animate-spin"/> : <Save size={11}/>} Save
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed min-h-[40px]">{selected.notes || <span className="text-gray-300 italic">No notes yet</span>}</p>
                    {selected.preferences && <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 p-3 rounded-xl leading-relaxed">⭐ {selected.preferences}</p>}
                  </div>
                )}
              </div>

              {/* Service History */}
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={9}/> Service History</p>
                <div className="space-y-2">
                  {customerHistory.slice(0,5).map(apt => (
                    <div key={apt.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{apt.service_type || apt.service_name || 'Service'}</p>
                        <p className="text-[10px] text-gray-400">{apt.vehicle_info || apt.vehicle_make_model || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-semibold text-gray-600">{new Date(apt.scheduled_time).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'2-digit'})}</p>
                        {apt.total_price && <p className="text-[10px] font-bold text-emerald-600">${apt.total_price}</p>}
                      </div>
                    </div>
                  ))}
                  {customerHistory.length > 5 && (
                    <p className="text-[10px] text-gray-400 text-center">+{customerHistory.length - 5} more visits</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}