"use client";
import { Drawer } from 'vaul';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Search, User, Phone } from 'lucide-react';

export default function NewAppointmentDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);
  
  // Controlled Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    price: '',
    date: '',
    service: 'Full Detail',
    status: 'Confirmed'
  });

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from('services').select('*').order('name');
      if (data) setServices(data);
    }
    if (isOpen) loadServices();
  }, [isOpen]);

  // --- GOOGLE CONTACT SEARCH ---
  const handleContactSearch = async (query: string) => {
    setFormData(prev => ({ ...prev, name: query }));
    if (query.length < 2) return setSuggestedContacts([]);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) return;

    try {
      const res = await fetch(`https://people.googleapis.com/v1/people:searchContacts?query=${query}&readMask=names,phoneNumbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSuggestedContacts(data.results || []);
    } catch (e) {
      console.error("Google Contact search failed", e);
    }
  };

  const selectContact = (c: any) => {
    const name = c.person.names?.[0]?.displayName || "";
    const phone = c.person.phoneNumbers?.[0]?.value || "";
    setFormData(prev => ({ ...prev, name, phone }));
    setSuggestedContacts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    const googleToken = session?.provider_token;

    // 1. Insert into Supabase
    const { error } = await supabase.from('appointments').insert([{
      user_id: user?.id,
      customer_name: formData.name,
      customer_phone: formData.phone,
      vehicle_make_model: formData.vehicle,
      vehicle_type: 'Sedan',
      service_name: formData.service,
      total_price: formData.price,
      status: formData.status,
      source: 'dashboard',
      scheduled_time: new Date(formData.date).toISOString(),
    }]);

    // 2. Sync to Google Calendar
    if (!error && googleToken) {
      try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `Detail: ${formData.name}`,
            description: `Vehicle: ${formData.vehicle} | Service: ${formData.service}`,
            start: { dateTime: new Date(formData.date).toISOString() },
            end: { dateTime: new Date(new Date(formData.date).getTime() + 7200000).toISOString() }
          })
        });
      } catch (e) { console.error("Calendar Sync Error", e); }
    }

    if (!error) {
      setIsOpen(false);
      window.location.reload(); 
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-10 right-10 bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110 active:scale-95">
          <Plus size={24} strokeWidth={1.5} />
        </button>
      </Drawer.Trigger>
      
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[2.5rem] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none p-8 text-black overflow-y-auto">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-200 mb-10" />
          
          <div className="max-w-md mx-auto w-full">
            <Drawer.Title className="text-2xl font-bold tracking-tightest lowercase italic mb-1">
              new_appointment
            </Drawer.Title>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-10">Google Sync Active</p>
            
            <form onSubmit={handleSubmit} className="space-y-8 pb-10">
              <div className="relative group">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Customer Name</label>
                <input 
                  required 
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                />
                
                {/* GOOGLE SEARCH RESULTS */}
                {suggestedContacts.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-100 rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                    {suggestedContacts.map((c, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => selectContact(c)}
                        className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                      >
                        <span className="text-xs font-bold italic">{c.person.names?.[0]?.displayName}</span>
                        <span className="text-[9px] text-gray-400 font-mono">{c.person.phoneNumbers?.[0]?.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Phone</label>
                <input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required 
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Vehicle Make/Model</label>
                <input 
                  value={formData.vehicle}
                  onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  placeholder="e.g. Tesla Model 3" 
                  required 
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors placeholder:text-gray-200" 
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Service Price ($)</label>
                  <input 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    type="number" 
                    required 
                    className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Date & Time</label>
                  <input 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    type="datetime-local" 
                    required 
                    className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Select Service</label>
                <select 
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full border-b border-gray-100 py-2 outline-none font-medium text-sm bg-transparent"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} (${s.price})</option>
                  ))}
                  <option value="Custom Detail">Custom Detail</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-gray-900 transition-all disabled:opacity-50 mt-10"
              >
                {loading ? 'syncing_to_google...' : 'confirm_appointment'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);
  
  // Controlled Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    price: '',
    date: '',
    service: 'Full Detail',
    status: 'Confirmed'
  });

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from('services').select('*').order('name');
      if (data) setServices(data);
    }
    if (isOpen) loadServices();
  }, [isOpen]);

  // --- GOOGLE CONTACT SEARCH ---
  const handleContactSearch = async (query: string) => {
    setFormData(prev => ({ ...prev, name: query }));
    if (query.length < 2) return setSuggestedContacts([]);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token;
    if (!token) return;

    try {
      const res = await fetch(`https://people.googleapis.com/v1/people:searchContacts?query=${query}&readMask=names,phoneNumbers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSuggestedContacts(data.results || []);
    } catch (e) {
      console.error("Google Contact search failed", e);
    }
  };

  const selectContact = (c: any) => {
    const name = c.person.names?.[0]?.displayName || "";
    const phone = c.person.phoneNumbers?.[0]?.value || "";
    setFormData(prev => ({ ...prev, name, phone }));
    setSuggestedContacts([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    const googleToken = session?.provider_token;

    // 1. Insert into Supabase
    const { error } = await supabase.from('appointments').insert([{
      user_id: user?.id,
      customer_name: formData.name,
      customer_phone: formData.phone,
      vehicle_make_model: formData.vehicle,
      vehicle_type: 'Sedan',
      service_name: formData.service,
      total_price: formData.price,
      status: formData.status,
      source: 'dashboard',
      scheduled_time: new Date(formData.date).toISOString(),
    }]);

    // 2. Sync to Google Calendar
    if (!error && googleToken) {
      try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: `Detail: ${formData.name}`,
            description: `Vehicle: ${formData.vehicle} | Service: ${formData.service}`,
            start: { dateTime: new Date(formData.date).toISOString() },
            end: { dateTime: new Date(new Date(formData.date).getTime() + 7200000).toISOString() }
          })
        });
      } catch (e) { console.error("Calendar Sync Error", e); }
    }

    if (!error) {
      setIsOpen(false);
      window.location.reload(); 
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button className="fixed bottom-10 right-10 bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110 active:scale-95">
          <Plus size={24} strokeWidth={1.5} />
        </button>
      </Drawer.Trigger>
      
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[2.5rem] h-[92%] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none p-8 text-black overflow-y-auto">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-gray-200 mb-10" />
          
          <div className="max-w-md mx-auto w-full">
            <Drawer.Title className="text-2xl font-bold tracking-tightest lowercase italic mb-1">
              new_appointment
            </Drawer.Title>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-10">Google Sync Active</p>
            
            <form onSubmit={handleSubmit} className="space-y-8 pb-10">
              <div className="relative group">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Customer Name</label>
                <input 
                  required 
                  autoComplete="off"
                  value={formData.name}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                />
                
                {/* GOOGLE SEARCH RESULTS */}
                {suggestedContacts.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-gray-100 rounded-2xl mt-1 shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                    {suggestedContacts.map((c, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => selectContact(c)}
                        className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                      >
                        <span className="text-xs font-bold italic">{c.person.names?.[0]?.displayName}</span>
                        <span className="text-[9px] text-gray-400 font-mono">{c.person.phoneNumbers?.[0]?.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Phone</label>
                <input 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required 
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Vehicle Make/Model</label>
                <input 
                  value={formData.vehicle}
                  onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  placeholder="e.g. Tesla Model 3" 
                  required 
                  className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors placeholder:text-gray-200" 
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Service Price ($)</label>
                  <input 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    type="number" 
                    required 
                    className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Date & Time</label>
                  <input 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    type="datetime-local" 
                    required 
                    className="w-full border-b border-gray-100 py-2 outline-none focus:border-black font-medium text-sm transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Select Service</label>
                <select 
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full border-b border-gray-100 py-2 outline-none font-medium text-sm bg-transparent"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} (${s.price})</option>
                  ))}
                  <option value="Custom Detail">Custom Detail</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-gray-900 transition-all disabled:opacity-50 mt-10"
              >
                {loading ? 'syncing_to_google...' : 'confirm_appointment'}
              </button>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}