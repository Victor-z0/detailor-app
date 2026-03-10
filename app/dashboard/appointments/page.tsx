"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, X, Calendar, Clock, Car, Phone, DollarSign,
  CheckCircle2, Trash2, Edit2, Bell, Mail, MessageSquare,
  AlertCircle, GripVertical, Timer, Zap, RefreshCw, User,
} from 'lucide-react';

const STATUSES = ['Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'Pending Payment'];
const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  'Confirmed':       { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500'    },
  'In-Progress':     { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  'Completed':       { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  'Cancelled':       { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
  'Pending Payment': { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-500'  },
};

const SERVICE_DURATIONS: Record<string, number> = {
  'Full Detail': 240, 'Interior Only': 120, 'Exterior Only': 90, 'Wash & Wax': 60,
  'Ceramic Coating': 480, 'Paint Correction': 360, 'PPF Install': 300, 'Engine Bay': 60,
};

const EMPTY_FORM = {
  customer_name: '', customer_phone: '', customer_email: '',
  vehicle_info: '', service_type: 'Full Detail',
  total_price: '', scheduled_time: '', status: 'Confirmed',
  notes: '', reminder_sms: true, reminder_email: false, duration_minutes: 240,
};

function DurBadge({ m }: { m: number }) {
  const h = Math.floor(m / 60); const min = m % 60;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400"><Timer size={9}/>{h > 0 ? `${h}h` : ''}{min > 0 ? ` ${min}m` : ''}</span>;
}

function RemBadge({ sms, email }: { sms: boolean; email: boolean }) {
  return (
    <div className="flex gap-1">
      {sms   && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><MessageSquare size={8}/> SMS</span>}
      {email && <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Mail size={8}/> Email</span>}
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services,     setServices]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState<any | null>(null);
  const [form,         setForm]         = useState<any>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [selected,     setSelected]     = useState<any | null>(null);
  const [dragId,       setDragId]       = useState<string | null>(null);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: apts }, { data: svcs }] = await Promise.all([
        supabase.from('appointments').select('*').eq('user_id', user.id).order('scheduled_time', { ascending: false }),
        supabase.from('services').select('*').eq('user_id', user.id),
      ]);
      setAppointments(apts || []);
      setServices(svcs || []);
      setLoading(false);
    })();
  }, []);

  function openNew() { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); }
  function openEdit(apt: any) {
    setEditing(apt);
    setForm({
      customer_name: apt.customer_name || '', customer_phone: apt.customer_phone || '',
      customer_email: apt.customer_email || '', vehicle_info: apt.vehicle_info || apt.vehicle_make_model || '',
      service_type: apt.service_type || apt.service_name || 'Full Detail',
      total_price: apt.total_price || '',
      scheduled_time: apt.scheduled_time ? new Date(apt.scheduled_time).toISOString().slice(0,16) : '',
      status: apt.status || 'Confirmed', notes: apt.notes || '',
      reminder_sms: apt.reminder_sms ?? true, reminder_email: apt.reminder_email ?? false,
      duration_minutes: apt.duration_minutes || 120,
    });
    setShowModal(true); setSelected(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!userId) return; setSaving(true);
    const payload = { ...form, user_id: userId, scheduled_time: new Date(form.scheduled_time).toISOString(), duration_minutes: Number(form.duration_minutes) };
    if (editing) {
      await supabase.from('appointments').update(payload).eq('id', editing.id);
      setAppointments(a => a.map(x => x.id === editing.id ? { ...x, ...payload } : x));
    } else {
      const { data } = await supabase.from('appointments').insert([payload]).select().single();
      if (data) setAppointments(a => [data, ...a]);
    }
    setSaving(false); setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(a => a.filter(x => x.id !== id)); setSelected(null);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
    setSelected((s: any) => s ? { ...s, status } : null);
  }

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase();
    return ((a.customer_name?.toLowerCase() || '').includes(q) || (a.customer_phone || '').includes(q) || (a.service_type || '').toLowerCase().includes(q))
      && (filterStatus === 'All' || a.status === filterStatus);
  });

  const today     = new Date().toDateString();
  const todayJobs = appointments.filter(a => new Date(a.scheduled_time).toDateString() === today);
  const upcoming  = appointments.filter(a => new Date(a.scheduled_time) > new Date() && a.status === 'Confirmed').length;
  const revenue   = appointments.filter(a => a.status === 'Completed').reduce((s, a) => s + Number(a.total_price || 0), 0);

  // Conflict: overlapping scheduled time + duration
  const conflict = form.scheduled_time
    ? appointments.find(a => {
        if (a.id === editing?.id) return false;
        const s1 = new Date(form.scheduled_time).getTime(); const e1 = s1 + (Number(form.duration_minutes)||120)*60000;
        const s2 = new Date(a.scheduled_time).getTime();    const e2 = s2 + (a.duration_minutes||120)*60000;
        return s1 < e2 && e1 > s2;
      })
    : null;

  if (loading) return <div className="flex items-center justify-center py-32"><RefreshCw size={20} className="text-gray-300 animate-spin"/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-24">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">{appointments.length} total · {upcoming} upcoming</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
          <Plus size={15}/> New Appointment
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today",    value: todayJobs.length,   color: 'text-blue-600',    bg: 'bg-blue-50',    icon: Calendar     },
          { label: 'Upcoming', value: upcoming,            color: 'text-amber-600',  bg: 'bg-amber-50',   icon: Clock        },
          { label: 'Done',     value: appointments.filter(a => a.status === 'Completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
          { label: 'Revenue',  value: `$${revenue.toLocaleString()}`, color: 'text-violet-600', bg: 'bg-violet-50', icon: DollarSign },
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

      {/* TODAY'S SCHEDULE STRIP */}
      {todayJobs.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Zap size={10} className="text-blue-500"/> Today's Schedule</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[...todayJobs].sort((a,b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()).map(job => {
              const m = STATUS_META[job.status] || STATUS_META['Confirmed'];
              return (
                <div key={job.id} onClick={() => setSelected(job)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl ${m.bg} cursor-pointer hover:shadow-sm transition-shadow`}>
                  <div className={`w-2 h-2 rounded-full ${m.dot}`}/>
                  <div>
                    <p className={`text-xs font-bold ${m.text}`}>{new Date(job.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{job.customer_name}</p>
                  </div>
                  <DurBadge m={job.duration_minutes || 120}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, service..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* KANBAN DRAG-DROP LANES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Confirmed', 'In-Progress', 'Completed'].map(lane => {
          const laneJobs = filtered.filter(a => a.status === lane);
          const meta     = STATUS_META[lane];
          return (
            <div key={lane}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) { updateStatus(dragId, lane); setDragId(null); } }}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${meta.dot}`}/>
                  <span className="text-xs font-bold text-gray-700">{lane}</span>
                  <span className="text-[10px] font-black text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">{laneJobs.length}</span>
                </div>
                {lane === 'Confirmed' && (
                  <button onClick={openNew} className="p-1 hover:bg-gray-100 rounded-lg"><Plus size={13} className="text-gray-400"/></button>
                )}
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {laneJobs.length === 0 && <p className="py-8 text-center text-xs text-gray-300">Drop here</p>}
                {laneJobs.map(apt => (
                  <div key={apt.id} draggable
                    onDragStart={() => setDragId(apt.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(apt)}
                    className={`group relative p-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm rounded-xl cursor-grab active:cursor-grabbing transition-all ${dragId === apt.id ? 'opacity-50 scale-95' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <GripVertical size={10} className="text-gray-300 flex-shrink-0"/>
                          <p className="text-sm font-bold text-gray-900 truncate">{apt.customer_name}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate pl-3.5">{apt.service_type || '—'}</p>
                        <p className="text-xs text-gray-300 truncate pl-3.5">{apt.vehicle_info || '—'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-900">{new Date(apt.scheduled_time).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                        <p className="text-[10px] text-gray-400">{new Date(apt.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pl-3.5">
                      <DurBadge m={apt.duration_minutes || 120}/>
                      <RemBadge sms={apt.reminder_sms} email={apt.reminder_email}/>
                      {apt.total_price && <span className="text-[10px] font-bold text-emerald-600 ml-auto">${apt.total_price}</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(apt)} className="p-1 hover:bg-blue-100 rounded-lg"><Edit2 size={11} className="text-blue-500"/></button>
                      <button onClick={() => handleDelete(apt.id)} className="p-1 hover:bg-red-100 rounded-lg"><Trash2 size={11} className="text-red-400"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* OTHER STATUS LIST */}
      {filtered.filter(a => !['Confirmed','In-Progress','Completed'].includes(a.status)).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelled / Pending</p></div>
          <div className="divide-y divide-gray-50">
            {filtered.filter(a => !['Confirmed','In-Progress','Completed'].includes(a.status)).map(apt => {
              const m = STATUS_META[apt.status] || STATUS_META['Confirmed'];
              return (
                <div key={apt.id} onClick={() => setSelected(apt)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <div className={`w-2 h-2 rounded-full ${m.dot} flex-shrink-0`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{apt.customer_name}</p>
                    <p className="text-xs text-gray-400">{apt.service_type} · {apt.vehicle_info}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.bg} ${m.text}`}>{apt.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Appointment' : 'New Appointment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={15} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Name</label>
                  <input required value={form.customer_name} onChange={e => setF('customer_name', e.target.value)} placeholder="James Wilson"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                  <input value={form.customer_phone} onChange={e => setF('customer_phone', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
                  <input type="email" value={form.customer_email} onChange={e => setF('customer_email', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</label>
                  <input value={form.vehicle_info} onChange={e => setF('vehicle_info', e.target.value)} placeholder="2022 BMW M3"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service</label>
                  <select value={form.service_type} onChange={e => { setF('service_type', e.target.value); setF('duration_minutes', SERVICE_DURATIONS[e.target.value] || 120); }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.keys(SERVICE_DURATIONS).map(s => <option key={s}>{s}</option>)}
                    {services.filter(s => !SERVICE_DURATIONS[s.name]).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Timer size={10}/> Duration</label>
                  <select value={form.duration_minutes} onChange={e => setF('duration_minutes', Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[30,60,90,120,180,240,300,360,480].map(m => <option key={m} value={m}>{m<60?`${m}m`:`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price ($)</label>
                  <input type="number" value={form.total_price} onChange={e => setF('total_price', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => setF('status', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Clock size={10}/> Date & Time</label>
                  <input type="datetime-local" required value={form.scheduled_time} onChange={e => setF('scheduled_time', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${conflict ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100 focus:ring-blue-500'}`}/>
                  {conflict && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                      <p className="text-xs text-amber-700"><strong>Conflict:</strong> {conflict.customer_name} has {conflict.service_type} at this time</p>
                    </div>
                  )}
                </div>
                {/* Reminders */}
                <div className="col-span-2 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Bell size={10}/> Automated Reminders</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'reminder_sms',   icon: MessageSquare, label: 'SMS Reminder',   sub: '24h + 2h before', active: form.reminder_sms,   color: 'blue'   },
                      { key: 'reminder_email', icon: Mail,          label: 'Email Reminder', sub: 'Day before',      active: form.reminder_email, color: 'violet' },
                    ].map(r => (
                      <button key={r.key} type="button" onClick={() => setF(r.key, !r.active)}
                        className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${r.active ? `bg-${r.color}-50 border-${r.color}-200` : 'bg-gray-50 border-gray-100'}`}>
                        <r.icon size={14} className={r.active ? `text-${r.color}-600` : 'text-gray-400'} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${r.active ? `text-${r.color}-700` : 'text-gray-500'}`}>{r.label}</p>
                          <p className="text-[10px] text-gray-400">{r.sub}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center flex-shrink-0 ${r.active ? `bg-${r.color}-600` : 'bg-gray-200'}`}>
                          {r.active && <CheckCircle2 size={9} className="text-white"/>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Special requests, access info..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-2">
                {editing && <button type="button" onClick={() => handleDelete(editing.id)} className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={14}/></button>}
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>}
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selected && !showModal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)}/>
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{selected.customer_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(STATUS_META[selected.status]||STATUS_META['Confirmed']).bg} ${(STATUS_META[selected.status]||STATUS_META['Confirmed']).text}`}>{selected.status}</span>
                  <DurBadge m={selected.duration_minutes || 120}/>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(selected)} className="p-2 hover:bg-blue-50 rounded-xl"><Edit2 size={14} className="text-gray-400"/></button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={15} className="text-gray-400"/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[['Service', selected.service_type], ['Vehicle', selected.vehicle_info || selected.vehicle_make_model], ['Date', new Date(selected.scheduled_time).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})], ['Time', new Date(selected.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})], ['Price', selected.total_price ? `$${selected.total_price}` : '—'], ['Phone', selected.customer_phone || '—']].map(([l,v]) => (
                  <div key={l} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm font-semibold text-gray-900">{v || '—'}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Reminders Set</p>
                <RemBadge sms={selected.reminder_sms} email={selected.reminder_email}/>
                {!selected.reminder_sms && !selected.reminder_email && <p className="text-xs text-gray-400">None</p>}
              </div>
              {selected.notes && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></div>}
              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Update Status</p>
                <div className="space-y-1.5">
                  {STATUSES.map(s => {
                    const m = STATUS_META[s];
                    return (
                      <button key={s} onClick={() => updateStatus(selected.id, s)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${selected.status === s ? `border-transparent ${m.bg} ${m.text}` : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                        <div className={`w-2 h-2 rounded-full ${m.dot}`}/>{s}
                        {selected.status === s && <CheckCircle2 size={12} className="ml-auto"/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-50 flex gap-2">
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-2.5 bg-red-50 text-red-500 font-bold text-sm rounded-xl hover:bg-red-100"><Trash2 size={14}/></button>
              <button onClick={() => updateStatus(selected.id, 'Completed')} className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700">
                <CheckCircle2 size={14}/> Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}