"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NewAppointmentDrawer from '@/components/NewAppointmentDrawer';
import { Menu, X, Check, ExternalLink, Copy, Clock, Calendar, Users, Layers, Settings } from 'lucide-react';

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState('Detailor');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

const navItems = [
  { 
    label: 'Overview', 
    href: '/dashboard', 
    icon: <Clock size={18} strokeWidth={1.5} /> 
  },
  { 
    label: 'Calendar', 
    href: '/dashboard/calendar', 
    icon: <Calendar size={18} strokeWidth={1.5} /> 
  },
  { 
    label: 'Customers', 
    href: '/dashboard/customers', 
    icon: <Users size={18} strokeWidth={1.5} /> 
  },
  { 
    label: 'Services', 
    href: '/dashboard/services', 
    icon: <Layers size={18} strokeWidth={1.5} /> 
  },
  { 
    label: 'Settings', 
    href: '/dashboard/settings', 
    icon: <Settings size={18} strokeWidth={1.5} /> 
  },
];

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: profile } = await supabase.from('profiles').select('business_name').eq('id', user.id).single();
      if (profile?.business_name) setBusinessName(profile.business_name);

      const { data: jobs } = await supabase.from('appointments').select('*').order('scheduled_time', { ascending: true });
      if (jobs) setAppointments(jobs);
      
      setLoading(false);
    }
    getData();
  }, [router]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
    }
  };

  const copyBookingLink = () => {
    const slug = businessName.toLowerCase().replace(/ /g, '-');
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Copied to clipboard.");
  };

  if (loading) return <div className="p-10 text-black font-medium text-center mt-20 tracking-tighter">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      
      {/* 1. MOBILE SIDEBAR */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} md:hidden`}>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-100 p-6 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10">
            <span className="font-bold tracking-tighter text-xl">Detailor</span>
            <button onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href ? 'bg-gray-50 text-black' : 'text-gray-400 hover:text-black'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 2. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-gray-100 flex-col fixed h-full p-6 bg-white">
        <div className="font-bold tracking-tighter text-xl mb-10">Detailor</div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 p-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? 'text-black bg-gray-50' : 'text-gray-400 hover:text-black'}`}>
               {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 3. MAIN CONTENT */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 bg-white/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden"><Menu size={20} /></button>
            <h2 className="text-sm font-semibold tracking-tight uppercase">Overview</h2>
          </div>
          <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold">
            {businessName.charAt(0)}
          </div>
        </header>

        <main className="p-6 md:p-12 max-w-5xl w-full mx-auto">
          
          {/* BOOKING LINK CARD (VERCEL STYLE) */}
          <div className="mb-12 p-6 border border-gray-200 rounded-xl flex items-center justify-between bg-white group hover:border-black transition-colors">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Public Booking Page</p>
              <p className="text-sm font-medium text-gray-600">book/{businessName.toLowerCase().replace(/ /g, '-')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={copyBookingLink} className="p-2 border border-gray-200 rounded-md hover:border-black transition-all">
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tightest mb-1">{businessName}</h1>
              <p className="text-sm text-gray-400 font-medium tracking-tight">Essential Tier • Active</p>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
             <StatCard label="Total Revenue" value={`$${appointments.reduce((a, b) => a + Number(b.total_price || 0), 0)}`} />
             <StatCard label="Total Jobs" value={appointments.length.toString()} />
             <StatCard label="Avg. Ticket" value={`$${appointments.length > 0 ? Math.round(appointments.reduce((a, b) => a + Number(b.total_price || 0), 0) / appointments.length) : 0}`} />
          </div>

          {/* JOB LIST WITH CHECK-IN WORKFLOW */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">Upcoming Schedule</h3>
            <div className="grid gap-2">
              {appointments.map((job) => (
                <div key={job.id} className="group flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'In-Progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'}`} />
                    <div>
                      <p className="text-sm font-semibold tracking-tight">{job.customer_name}</p>
                      <p className="text-xs text-gray-400 font-medium">{job.vehicle_make_model} • {job.service_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {job.status === 'Confirmed' && (
                      <button 
                        onClick={() => updateStatus(job.id, 'In-Progress')}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-black rounded hover:bg-black hover:text-white transition-all"
                      >
                        Start Job
                      </button>
                    )}
                    {job.status === 'In-Progress' && (
                      <button 
                        onClick={() => updateStatus(job.id, 'Completed')}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-black text-white rounded hover:bg-gray-800 transition-all"
                      >
                        Complete
                      </button>
                    )}
                    {job.status === 'Completed' && <Check size={16} className="text-gray-300" />}
                    <p className="text-sm font-bold tracking-tighter ml-2">${job.total_price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <NewAppointmentDrawer />
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col justify-between h-32 hover:border-black transition-colors">
      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
      <h4 className="text-3xl font-bold tracking-tightest">{value}</h4>
    </div>
  );
}