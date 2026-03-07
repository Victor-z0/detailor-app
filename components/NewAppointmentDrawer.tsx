"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, User, Phone, Car, DollarSign, Calendar, Scissors, Mail } from "lucide-react";

const STATUSES = ["Confirmed", "In-Progress", "Completed", "Cancelled", "Pending Payment"];

export default function NewAppointmentDrawer({ onCreated }: { onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", vehicle: "", price: "", date: "", service: "", status: "Confirmed"
  });

  useEffect(() => {
    async function loadServices() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("services").select("*").eq("user_id", user.id).order("name");
      if (data) setServices(data);
    }
    if (isOpen) loadServices();
  }, [isOpen]);

  function set(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from("appointments").insert([{
      user_id: user.id, customer_name: formData.name, customer_phone: formData.phone,
      customer_email: formData.email, vehicle_info: formData.vehicle, vehicle_make_model: formData.vehicle,
      service_type: formData.service, service_name: formData.service, total_price: formData.price,
      status: formData.status, source: "dashboard", scheduled_time: new Date(formData.date).toISOString(),
    }]);
    if (!error) {
      setIsOpen(false);
      setFormData({ name: "", phone: "", email: "", vehicle: "", price: "", date: "", service: "", status: "Confirmed" });
      onCreated?.();
    }
    setLoading(false);
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center z-50 transition-all hover:scale-105 active:scale-95">
        <Plus size={22} strokeWidth={2.5} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div><h3 className="text-base font-bold text-gray-900">New Appointment</h3><p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p></div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={16} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Name</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input required value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Full name" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} /><input value={formData.phone} onChange={e => set("phone", e.target.value)} placeholder="555-0000" className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} /><input type="email" value={formData.email} onChange={e => set("email", e.target.value)} placeholder="email@..." className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle</label>
                <div className="relative"><Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input required value={formData.vehicle} onChange={e => set("vehicle", e.target.value)} placeholder="e.g. 2022 BMW M3" className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service</label>
                <div className="relative"><Scissors className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} /><select value={formData.service} onChange={e => set("service", e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"><option value="">Select service</option>{services.map(s => (<option key={s.id} value={s.name}>{s.name} - ${s.price}</option>))}<option value="Custom">Custom</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</label>
                  <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} /><input required type="number" value={formData.price} onChange={e => set("price", e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date and Time</label>
                  <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={13} /><input required type="datetime-local" value={formData.date} onChange={e => set("date", e.target.value)} className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                <select value={formData.status} onChange={e => set("status", e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">{loading ? "Adding..." : "Add Appointment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
