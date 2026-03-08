"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Scissors, Clock, DollarSign, Edit2, Trash2, ChevronRight } from 'lucide-react';

const EMPTY = { name: '', description: '', price: '', duration: '' };

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('services').select('*').eq('user_id', user.id).order('price', { ascending: true });
      setServices(data || []);
      setLoading(false);
    }
    init();
  }, []);

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(svc: any) { setEditing(svc); setForm({ name: svc.name, description: svc.description || '', price: svc.price, duration: svc.duration || '' }); setShowModal(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const payload = { ...form, user_id: userId, price: Number(form.price) };
    if (editing) {
      const { error } = await supabase.from('services').update(payload).eq('id', editing.id);
      if (!error) setServices(s => s.map(x => x.id === editing.id ? { ...x, ...payload } : x));
    } else {
      const { data, error } = await supabase.from('services').insert([payload]).select().single();
      if (!error && data) setServices(s => [...s, data]);
    }
    setSaving(false);
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service?')) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(s => s.filter(x => x.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Menu</h1>
          <p className="text-sm text-gray-400 mt-0.5">{services.length} services</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div onClick={openNew} className="border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all group">
          <div className="w-14 h-14 bg-gray-100 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
            <Scissors size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-base font-semibold text-gray-400">Add your first service</p>
          <p className="text-sm text-gray-300 mt-1">Click to create a service offering</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(svc => (
            <div key={svc.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-gray-900 text-base">{svc.name}</h3>
                  {svc.description && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{svc.description}</p>}
                  {svc.duration && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock size={11} />{svc.duration}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-2xl font-black text-blue-600">${svc.price}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(svc)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} className="text-gray-400 hover:text-blue-600" /></button>
                    <button onClick={() => handleDelete(svc.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-gray-400 hover:text-red-500" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={openNew} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/20 transition-all flex items-center justify-center gap-2">
            <Plus size={16} /> Add another service
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editing ? 'Edit Service' : 'New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</label>
                <input required value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Detail" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Describe what's included..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                    <input required type="number" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                    <input value={form.duration} onChange={e => setForm((f: any) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 3-4 hours" className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {editing && <button type="button" onClick={() => { handleDelete(editing.id); setShowModal(false); }} className="px-4 py-2.5 bg-red-50 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>}
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}