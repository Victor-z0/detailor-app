"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Trash2,
  AlertCircle, Phone, Car, CheckCircle2, DollarSign,
  Briefcase, User, Calendar, List, Grid, RefreshCw,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Confirmed:  'bg-blue-500',
  Completed:  'bg-emerald-500',
  Cancelled:  'bg-red-400',
  Pending:    'bg-amber-400',
};

const SERVICES = ['Full Detail','Interior Only','Exterior Only','Wash & Wax','Ceramic Coating','Paint Correction','PPF Install','Tint'];

export default function CalendarPage() {
  const [view,         setView]         = useState<'month'|'week'|'list'>('month');
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selected,     setSelected]     = useState<Date | null>(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [detailJob,    setDetailJob]    = useState<any>(null);
  const [conflict,     setConflict]     = useState(false);

  const [form, setForm] = useState({
    customer_name: '', vehicle: '', service: 'Full Detail',
    date: '', price: '', phone: '',
  });
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function fetchJobs() {
    const { data } = await supabase.from('appointments').select('*').order('scheduled_time', { ascending: true });
    setAppointments(data || []);
  }

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (!form.date) return setConflict(false);
    const ds = new Date(form.date).toDateString();
    setConflict(appointments.some(a => new Date(a.scheduled_time).toDateString() === ds));
  }, [form.date, appointments]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('appointments').insert([{
      customer_name:  form.customer_name,
      customer_phone: form.phone,
      vehicle_info:   form.vehicle,
      service_type:   form.service,
      scheduled_time: form.date,
      total_price:    form.price,
      status:         'Confirmed',
    }]);
    if (!error) {
      await fetchJobs();
      setDrawerOpen(false);
      setForm({ customer_name:'', vehicle:'', service:'Full Detail', date:'', price:'', phone:'' });
    }
    setLoading(false);
  }

  async function deleteJob(id: string) {
    if (!confirm('Remove this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    fetchJobs();
    setDetailJob(null);
  }

  // ── MONTH GRID ──────────────────────────────────────
  function getMonthDays(date: Date) {
    const year  = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const startPad = first.getDay(); // 0=Sun
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }

  // ── WEEK GRID ───────────────────────────────────────
  function getWeekDays(date: Date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }

  function jobsForDay(day: Date) {
    return appointments.filter(a => new Date(a.scheduled_time).toDateString() === day.toDateString());
  }

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  }

  const monthDays  = getMonthDays(currentDate);
  const weekDays   = getWeekDays(currentDate);
  const today      = new Date();
  const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const selectedJobs = selected ? jobsForDay(selected) : [];

  // list: upcoming sorted
  const upcomingJobs = [...appointments]
    .filter(a => new Date(a.scheduled_time) >= new Date(today.toDateString()))
    .sort((a,b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {view === 'month'
              ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : view === 'week'
              ? `Week of ${weekDays[0].toLocaleDateString('en-US', { month:'short', day:'numeric' })}`
              : 'Upcoming Appointments'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            {([['month', Grid],['week', Calendar],['list', List]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${view === v ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                <Icon size={12}/> <span className="hidden sm:inline">{v}</span>
              </button>
            ))}
          </div>
          {/* Nav */}
          {view !== 'list' && (
            <div className="flex items-center bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-gray-50 border-r border-gray-100">
                <ChevronLeft size={15} className="text-gray-500"/>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">Today</button>
              <button onClick={() => navigate(1)} className="p-2.5 hover:bg-gray-50 border-l border-gray-100">
                <ChevronRight size={15} className="text-gray-500"/>
              </button>
            </div>
          )}
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
            <Plus size={15}/> <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[80px] sm:min-h-[100px] border-r border-b border-gray-50 bg-gray-50/30 last:border-r-0"/>;
              const isToday    = day.toDateString() === today.toDateString();
              const isSelected = selected?.toDateString() === day.toDateString();
              const jobs       = jobsForDay(day);
              const isLastCol  = (i + 1) % 7 === 0;
              return (
                <div key={i}
                  onClick={() => setSelected(day)}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-r border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/30 ${isLastCol ? 'border-r-0' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {jobs.slice(0, 2).map(job => (
                      <div key={job.id}
                        onClick={e => { e.stopPropagation(); setDetailJob(job); }}
                        className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white truncate cursor-pointer hover:opacity-80 ${STATUS_COLORS[job.status] || 'bg-blue-500'}`}>
                        <span className="hidden sm:inline">{new Date(job.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · </span>
                        {job.customer_name}
                      </div>
                    ))}
                    {jobs.length > 2 && (
                      <div className="text-[9px] font-bold text-gray-400 px-1">+{jobs.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view === 'week' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map((day, i) => {
              const isToday    = day.toDateString() === today.toDateString();
              const isSelected = selected?.toDateString() === day.toDateString();
              const jobs       = jobsForDay(day);
              return (
                <button key={i} onClick={() => setSelected(day)}
                  className={`p-2 sm:p-3 text-center transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {DAY_NAMES[day.getDay()]}
                  </p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold transition-colors ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </div>
                  {jobs.length > 0 && (
                    <div className="mt-1.5 flex justify-center gap-0.5">
                      {jobs.slice(0,3).map((_,i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-blue-400' : 'bg-gray-300'}`}/>)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[320px]">
            {weekDays.map((day, i) => {
              const isToday    = day.toDateString() === today.toDateString();
              const isSelected = selected?.toDateString() === day.toDateString();
              const jobs       = jobsForDay(day);
              return (
                <div key={i} className={`p-1.5 border-r border-gray-50 last:border-0 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                  {jobs.map(job => (
                    <div key={job.id} onClick={() => setDetailJob(job)}
                      className={`mb-1 p-1.5 rounded-lg text-white text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[job.status] || 'bg-blue-500'}`}>
                      <p className="truncate">{job.customer_name}</p>
                      <p className="opacity-80 text-[9px]">
                        {new Date(job.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <button onClick={() => { setSelected(day); setDrawerOpen(true); setF('date', day.toISOString().slice(0,16)); }}
                      className="w-full h-8 rounded-lg border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-center mt-1">
                      <Plus size={11} className="text-gray-300"/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="space-y-3">
          {upcomingJobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <Calendar size={32} className="text-gray-200 mx-auto mb-3"/>
              <p className="font-semibold text-gray-400">No upcoming appointments</p>
              <button onClick={() => setDrawerOpen(true)} className="mt-3 text-sm text-blue-600 font-semibold hover:underline">+ Add one</button>
            </div>
          )}
          {upcomingJobs.map(job => (
            <div key={job.id} onClick={() => setDetailJob(job)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all">
              <div className={`w-2 h-12 rounded-full flex-shrink-0 ${STATUS_COLORS[job.status] || 'bg-blue-500'}`}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{job.customer_name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[job.status] || 'bg-blue-500'}`}>{job.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{job.vehicle_info} · {job.service_type}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {new Date(job.scheduled_time).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(job.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </p>
                {job.total_price && <p className="text-xs font-bold text-emerald-600">${job.total_price}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SELECTED DAY PANEL (month + week) */}
      {selected && view !== 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {selected.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              </h3>
              <p className="text-xs text-gray-400">{selectedJobs.length} appointment{selectedJobs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDrawerOpen(true); setF('date', selected.toISOString().slice(0,10) + 'T09:00'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                <Plus size={12}/> Add
              </button>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={14}/>
              </button>
            </div>
          </div>
          <div className="p-4">
            {selectedJobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No appointments — click Add to schedule one</p>
            ) : (
              <div className="space-y-2">
                {selectedJobs.map(job => (
                  <div key={job.id} onClick={() => setDetailJob(job)}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors group">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[job.status] || 'bg-blue-500'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{job.customer_name}</p>
                      <p className="text-xs text-gray-400">{job.service_type} · {job.vehicle_info}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-600">
                        {new Date(job.scheduled_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                      </p>
                      {job.total_price && <p className="text-xs text-emerald-600 font-bold">${job.total_price}</p>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteJob(job.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOB DETAIL MODAL */}
      {detailJob && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetailJob(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[detailJob.status] || 'bg-blue-500'}`}/>
                <h3 className="font-bold text-gray-900">{detailJob.customer_name}</h3>
              </div>
              <button onClick={() => setDetailJob(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={14}/></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { icon: Car,      label: 'Vehicle',  value: detailJob.vehicle_info },
                { icon: Briefcase,label: 'Service',  value: detailJob.service_type },
                { icon: Clock,    label: 'Time',     value: new Date(detailJob.scheduled_time).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) },
                { icon: Phone,    label: 'Phone',    value: detailJob.customer_phone },
                { icon: DollarSign,label:'Price',    value: detailJob.total_price ? `$${detailJob.total_price}` : null },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <f.icon size={14} className="text-gray-400 flex-shrink-0"/>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-50 flex gap-2">
              <button onClick={() => deleteJob(detailJob.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                <Trash2 size={14}/> Delete
              </button>
              <button onClick={() => setDetailJob(null)}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD APPOINTMENT DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}/>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">New Appointment</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><User size={11}/> Customer Name</label>
                <input required value={form.customer_name} onChange={e => setF('customer_name', e.target.value)}
                  placeholder="James Wilson"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Phone size={11}/> Phone</label>
                  <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+1 555 0000"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={11}/> Price</label>
                  <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Car size={11}/> Vehicle</label>
                <input required value={form.vehicle} onChange={e => setF('vehicle', e.target.value)} placeholder="2022 Toyota Camry"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Briefcase size={11}/> Service</label>
                <select value={form.service} onChange={e => setF('service', e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Clock size={11}/> Date & Time</label>
                <input type="datetime-local" required value={form.date} onChange={e => setF('date', e.target.value)}
                  className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${conflict ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100 focus:ring-blue-500'}`}/>
                {conflict && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle size={10}/> Another job on this day</p>}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm mt-2">
                {loading ? <RefreshCw size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}
                {loading ? 'Saving...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}