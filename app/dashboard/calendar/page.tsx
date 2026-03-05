"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Trash2, AlertCircle, Phone, Car, CheckCircle2, DollarSign, Briefcase, User, Zap } from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customer_name: '', vehicle: '', service: 'Full Detail',
    date: '', price: '', phone: ''
  });

  const fetchJobs = async () => {
    const { data } = await supabase.from('appointments').select('*').order('scheduled_time', { ascending: true });
    setAppointments(data || []);
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    if (!formData.date) return;
    const selectedDateStr = new Date(formData.date).toDateString();
    setConflict(appointments.some(app => new Date(app.scheduled_time).toDateString() === selectedDateStr));
  }, [formData.date, appointments]);

  const handleContactSearch = async (query: string) => {
    setFormData({ ...formData, customer_name: query });
    if (query.length < 2) return setSuggestedContacts([]);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) return;
    try {
      const res = await fetch(`https://people.googleapis.com/v1/people:searchContacts?query=${query}&readMask=names,phoneNumbers`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSuggestedContacts(data.results || []);
    } catch (e) { console.error(e); }
  };

  const selectContact = (c: any) => {
    setFormData({ ...formData, customer_name: c.person.names?.[0]?.displayName || '', phone: c.person.phoneNumbers?.[0]?.value || '' });
    setSuggestedContacts([]);
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const googleToken = session?.provider_token;
    const { error } = await supabase.from('appointments').insert([{
      customer_name: formData.customer_name, customer_phone: formData.phone,
      vehicle_info: formData.vehicle, service_type: formData.service,
      scheduled_time: formData.date, total_price: formData.price, status: 'Confirmed'
    }]);
    if (!error && googleToken) {
      try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: `Detail: ${formData.customer_name}`, description: `Vehicle: ${formData.vehicle}`, start: { dateTime: new Date(formData.date).toISOString() }, end: { dateTime: new Date(new Date(formData.date).getTime() + 7200000).toISOString() } })
        });
      } catch (e) { console.error(e); }
    }
    if (!error) {
      await fetchJobs();
      setIsDrawerOpen(false);
      setFormData({ customer_name: '', vehicle: '', service: 'Full Detail', date: '', price: '', phone: '' });
    }
    setLoading(false);
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Remove this appointment?')) return;
    await supabase.from('appointments').delete().eq('id', id);
    fetchJobs();
  };

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const selectedDayJobs = selectedDay
    ? appointments.filter(a => new Date(a.scheduled_time).toDateString() === selectedDay.toDateString())
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Week of {startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2.5 hover:bg-gray-50 transition-colors border-r border-gray-100">
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Today
            </button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2.5 hover:bg-gray-50 transition-colors border-l border-gray-100">
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          </div>
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <Plus size={16} /> New Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WEEKLY GRID */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {days.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();
              const dayJobs = appointments.filter(a => new Date(a.scheduled_time).toDateString() === day.toDateString());
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`p-3 text-center transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold transition-colors ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </div>
                  {dayJobs.length > 0 && (
                    <div className="mt-1.5 flex justify-center gap-0.5">
                      {dayJobs.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-blue-300' : 'bg-gray-300'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Job Slots */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {days.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === day.toDateString();
              const dayJobs = appointments.filter(a => new Date(a.scheduled_time).toDateString() === day.toDateString());
              return (
                <div key={idx} className={`p-2 border-r border-gray-50 last:border-r-0 ${isSelected ? 'bg-blue-50/30' : ''}`}>
                  <div className="space-y-1.5">
                    {dayJobs.map(job => (
                      <div key={job.id} className={`group relative p-2 rounded-lg text-xs cursor-pointer transition-colors ${isToday ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                        <button onClick={() => deleteJob(job.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                        <p className="font-semibold truncate pr-3">{job.customer_name}</p>
                        <p className={`text-[10px] mt-0.5 ${isToday ? 'text-blue-200' : 'text-blue-500'}`}>
                          {new Date(job.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SELECTED DAY PANEL */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">
              {selectedDay ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{selectedDayJobs.length} appointments</p>
          </div>
          <div className="p-4 space-y-3">
            {!selectedDay ? (
              <p className="text-sm text-gray-400 text-center py-8">Click a day to see appointments</p>
            ) : selectedDayJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-medium text-gray-400">No appointments</p>
                <button onClick={() => setIsDrawerOpen(true)} className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add one</button>
              </div>
            ) : (
              selectedDayJobs.map(job => (
                <div key={job.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.vehicle_info || job.vehicle_make_model}</p>
                    </div>
                    <button onClick={() => deleteJob(job.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {new Date(job.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">${job.total_price}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ADD APPOINTMENT DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Appointment</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer Name */}
              <div className="relative space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input required autoComplete="off" value={formData.customer_name} onChange={e => handleContactSearch(e.target.value)} placeholder="Search contacts..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                {suggestedContacts.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-100 rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto">
                    {suggestedContacts.map((c, i) => (
                      <button key={i} type="button" onClick={() => selectContact(c)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between border-b border-gray-50 last:border-0">
                        <span className="text-sm font-semibold">{c.person.names?.[0]?.displayName}</span>
                        <span className="text-xs text-gray-400">{c.person.phoneNumbers?.[0]?.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input required value={formData.vehicle} onChange={e => setFormData({ ...formData, vehicle: e.target.value })} placeholder="Make / Model" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <input type="datetime-local" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${conflict ? 'border-red-300 ring-2 ring-red-100 bg-red-50' : 'border-gray-100 focus:ring-blue-500'}`} />
                  {conflict && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> Another job is scheduled this day</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                  <select value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                    <option>Full Detail</option>
                    <option>Interior Only</option>
                    <option>Wash & Wax</option>
                    <option>Ceramic Coating</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-4">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                {loading ? 'Saving...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}