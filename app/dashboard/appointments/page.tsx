"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, X, Calendar, Clock, Car, Phone, DollarSign, ChevronDown, CheckCircle2, Trash2, Edit2, Filter } from 'lucide-react';

const STATUSES = ['Confirmed', 'In-Progress', 'Completed', 'Cancelled', 'Pending Payment'];
const STATUS_COLORS: Record<string, string> = {
  'Confirmed': 'bg-blue-50 text-blue-600',
  'In-Progress': 'bg-amber-50 text-amber-600',
  'Completed': 'bg-emerald-50 text-emerald-600',
  'Cancelled': 'bg-red-50 text-red-500',
  'Pending Payment': 'bg-violet-50 text-violet-600',
};

const EMPTY_FORM = { customer_name: '', customer_phone: '', customer_email: '', vehicle_info: '', vehicle_type: 'Sedan', service_type: '', total_price: '', scheduled_time: '', status: 'Confirmed', notes: '' };

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
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
    }
    init();
  }, []);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(apt: any) {
    setEditing(apt);
    setForm({
      customer_name: apt.customer_name || '',
      customer_phone: apt.customer_phone || '',
      customer_email: apt.customer_email || '',
      vehicle_info: apt.vehicle_info || apt.vehicle_make_model || '',
      vehicle_type: apt.vehicle_type || 'Sedan',
      service_type: apt.service_type || apt.service_name || '',
      total_price: apt.total_price || '',
      scheduled_time: apt.scheduled_time ? new Date(apt.scheduled_time).toISOString().slice(0, 16) : '',
      status: apt.status || 'Confirmed',
      notes: apt.notes || '',
    });
    setShowModal(true);
    setSelected(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const payload = { ...form, user_id: userId, scheduled_time: new Date(form.scheduled_time).toISOString() };
    if (editing) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editing.id);
      if (!error) setAppointments(a => a.map(x => x.id === editing.id ? { ...x, ...payload } : x));
    } else {
      const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
      if (!error && data) setAppointments(a => [data, ...a]);
    }
    setSaving(false);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    setAppointments(a => a.filter(x => x.id !== id));
    setSelected(null);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x));
    setSelected((s: any) => s ? { ...s, status } : null);
  }

  const filtered = appointments.filter(a => {
    const matchSearch = a.customer_name?.toLowerCase().includes(search.toLowerCase()) || a.customer_phone?.includes(search);
    const matchStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">{appointments.length} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          <Plus size={16} /> New Appointment
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="pl-8 pr-8 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none font-medium text-gray-700">
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={13} />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Client</span><span>Service</span><span>Date</span><span>Price</span><span>Status</span><span></span>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No appointments found</p>
              <button onClick={openNew} className="mt-3 text-xs text-blue-600 font-semibold">+ Add one</button>
            </div>
          ) : filtered.map(apt => (
            <div key={apt.id} onClick={() => setSelected(apt)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {apt.customer_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{apt.customer_name}</p>
                <p className="text-xs text-gray-400 truncate">{apt.service_type || apt.service_name || '—'} · {apt.vehicle_info || '—'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-gray-900">{new Date(apt.scheduled_time).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold mt-0.5 ${STATUS_COLORS[apt.status] || 'bg-gray-50 text-gray-500'}`}>{apt.status}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(apt)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} className="text-gray-300 hover:text-blue-600" /></button>
                <button onClick={() => handleDelete(apt.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} className="text-gray-300 hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Appointment' : 'New Appointment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Name</label>
                  <input required value={form.customer_name} onChange={e => setForm((f: any) => ({ ...f, customer_name: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</label>
                  <input value={form.customer_phone} onChange={e => setForm((f: any) => ({ ...f, customer_phone: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                  <input type="email" value={form.customer_email} onChange={e => setForm((f: any) => ({ ...f, customer_email: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle</label>
                  <input value={form.vehicle_info} onChange={e => setForm((f: any) => ({ ...f, vehicle_info: e.target.value }))} placeholder="e.g. 2022 BMW M3" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</label>
                  <select value={form.service_type} onChange={e => setForm((f: any) => ({ ...f, service_type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select service</option>
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price ($)</label>
                  <input type="number" value={form.total_price} onChange={e => setForm((f: any) => ({ ...f, total_price: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</label>
                  <input required type="datetime-local" value={form.scheduled_time} onChange={e => setForm((f: any) => ({ ...f, scheduled_time: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {editing && <button type="button" onClick={() => handleDelete(editing.id)} className="px-4 py-2.5 bg-red-50 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>}
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selected && !showModal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{selected.customer_name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selected)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={15} className="text-gray-400 hover:text-blue-600" /></button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[['Service', selected.service_type || selected.service_name], ['Vehicle', selected.vehicle_info || selected.vehicle_make_model], ['Date', new Date(selected.scheduled_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', new Date(selected.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })], ['Price', `$${selected.total_price || 0}`], ['Phone', selected.customer_phone]].map(([l, v]) => (
                  <div key={l} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm font-semibold text-gray-900">{v || '—'}</p>
                  </div>
                ))}
              </div>
              {selected.notes && <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></div>}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${selected.status === s ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-100 text-gray-600 hover:border-blue-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => handleDelete(selected.id)} className="px-4 py-3 bg-red-50 text-red-500 font-semibold text-sm rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={15} /></button>
              <button onClick={() => updateStatus(selected.id, 'Completed')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 size={15} /> Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}