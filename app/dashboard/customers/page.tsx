"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Phone, Car, Mail, Star, Shield, Zap,
  Users, DollarSign, X, Calendar, TrendingUp,
  ChevronRight, MessageSquare, Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const router = useRouter();
  const [customers,       setCustomers]       = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [searchTerm,      setSearchTerm]      = useState('');
  const [loading,         setLoading]         = useState(true);
  const [selected,        setSelected]        = useState<any>(null);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('appointments').select('*').eq('user_id', user.id)
      .order('scheduled_time', { ascending: false });
    if (!error && data) {
      setAllAppointments(data);
      const unique = data.reduce((acc: any[], cur) => {
        const key = cur.customer_phone || cur.customer_email;
        const existing = acc.find(i => (i.customer_phone || i.customer_email) === key);
        if (!existing) {
          return acc.concat([{
            ...cur,
            total_spent: Number(cur.total_price || 0),
            visit_count: 1,
            last_visit:  cur.scheduled_time,
            vehicles: [cur.vehicle_info || cur.vehicle_make_model].filter(Boolean),
          }]);
        }
        existing.total_spent += Number(cur.total_price || 0);
        existing.visit_count  += 1;
        const v = cur.vehicle_info || cur.vehicle_make_model;
        if (v && !existing.vehicles.includes(v)) existing.vehicles.push(v);
        return acc;
      }, []);
      setCustomers(unique);
    }
    setLoading(false);
  }

  const getTier = (spent: number) => {
    if (spent > 1500) return { label: 'VIP',     cls: 'bg-violet-50 text-violet-600 border border-violet-100', icon: <Shield size={10} /> };
    if (spent > 500)  return { label: 'Regular', cls: 'bg-blue-50 text-blue-600 border border-blue-100',       icon: <Star   size={10} /> };
    return              { label: 'New',     cls: 'bg-emerald-50 text-emerald-600 border border-emerald-100', icon: <Zap    size={10} /> };
  };

  const filtered = customers.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm) ||
    c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue  = customers.reduce((a, c) => a + c.total_spent, 0);
  const vipCount      = customers.filter(c => c.total_spent > 1500).length;
  const clientHistory = selected
    ? allAppointments.filter(a =>
        (a.customer_phone && a.customer_phone === selected.customer_phone) ||
        (a.customer_email && a.customer_email === selected.customer_email))
    : [];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} total clients</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: customers.length,                                                             icon: <Users      size={16} className="text-blue-600"   />, bg: 'bg-blue-50'   },
          { label: 'VIP Clients',   value: vipCount,                                                                     icon: <Shield     size={16} className="text-violet-600" />, bg: 'bg-violet-50' },
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`,                                          icon: <DollarSign size={16} className="text-emerald-600"/>, bg: 'bg-emerald-50' },
          { label: 'Avg. Spent',    value: customers.length ? `$${Math.round(totalRevenue / customers.length)}` : '$0', icon: <TrendingUp size={16} className="text-orange-500" />, bg: 'bg-orange-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
        <input type="text" placeholder="Search by name, phone, or email..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => {
          const tier = getTier(client.total_spent);
          return (
            <div key={client.customer_phone || client.customer_email}
              onClick={() => setSelected(client)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {client.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{client.customer_name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${tier.cls}`}>
                      {tier.icon} {tier.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900">${client.total_spent.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-300">total spent</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                {client.customer_phone && <div className="flex items-center gap-2 text-xs text-gray-400"><Phone size={11} />{client.customer_phone}</div>}
                {client.customer_email && <div className="flex items-center gap-2 text-xs text-gray-400"><Mail  size={11} />{client.customer_email}</div>}
                {client.vehicles?.[0]  && <div className="flex items-center gap-2 text-xs text-gray-400"><Car   size={11} />{client.vehicles[0]}</div>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-gray-300 uppercase tracking-wider">Visits</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">{client.visit_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-300 uppercase tracking-wider">Last Visit</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">
                      {new Date(client.last_visit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-gray-100">
            <Users size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No customers found</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">Client Profile</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                  {selected.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.customer_name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getTier(selected.total_spent).cls}`}>
                    {getTier(selected.total_spent).icon} {getTier(selected.total_spent).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { l: 'Total Spent', v: `$${selected.total_spent.toLocaleString()}` },
                  { l: 'Visits',      v: selected.visit_count },
                  { l: 'Avg/Visit',   v: selected.visit_count ? `$${Math.round(selected.total_spent / selected.visit_count)}` : '$0' },
                ].map(s => (
                  <div key={s.l} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-base font-black text-gray-900">{s.v}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {selected.customer_phone && <a href={`tel:${selected.customer_phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-blue-50 transition-colors"><Phone size={14} className="text-gray-400" />{selected.customer_phone}</a>}
                {selected.customer_email && <a href={`mailto:${selected.customer_email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-blue-50 transition-colors"><Mail size={14} className="text-gray-400" />{selected.customer_email}</a>}
              </div>
            </div>
            <div className="px-6 py-4 border-b border-gray-50 grid grid-cols-2 gap-3">
              <button onClick={() => router.push('/dashboard/messages')} className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-semibold rounded-xl transition-colors">
                <MessageSquare size={13} /> Message
              </button>
              <button onClick={() => router.push('/dashboard/appointments?new=1')} className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                <Plus size={13} /> Book Again
              </button>
            </div>
            {selected.vehicles?.length > 0 && (
              <div className="p-6 border-b border-gray-50">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicles</h4>
                <div className="space-y-2">
                  {selected.vehicles.map((v: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700"><Car size={14} className="text-gray-400" />{v}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="p-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Appointment History</h4>
              <div className="space-y-3">
                {clientHistory.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-4">No history</p>
                  : clientHistory.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{apt.service_type || apt.service_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={10} />{new Date(apt.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">${apt.total_price}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : apt.status === 'Cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>{apt.status}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}