"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NewAppointmentDrawer from '@/components/NewAppointmentDrawer';

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // THE FULL TAB LIST
  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Calendar', href: '/dashboard/calendar', icon: '📅' },
    { label: 'Appointments', href: '/dashboard/appointments', icon: '📝' },
    { label: 'Customers', href: '/dashboard/customers', icon: '👤' },
    { label: 'Services', href: '/dashboard/services', icon: '🛠️' },
    { label: 'Staff', href: '/dashboard/staff', icon: '👥' },
    { label: 'Gallery', href: '/dashboard/gallery', icon: '🖼️' },
    { label: 'Reports', href: '/dashboard/reports', icon: '📊' },
    { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data: profile } = await supabase.from('profiles').select('business_name').eq('id', user.id).single();
      if (profile) setBusinessName(profile.business_name);
      const { data: jobs } = await supabase.from('appointments').select('*').order('scheduled_time', { ascending: true });
      if (jobs) setAppointments(jobs);
      setLoading(false);
    }
    getData();
  }, [router]);

  if (loading) return <div className="p-10 text-black font-black text-center mt-20">DETAILOR...</div>;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-black">
      
      {/* 1. MOBILE HAMBURGER OVERLAY (Sliding Sidebar) */}
      <div className={`fixed inset-0 z-50 transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="bg-white w-72 h-full shadow-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <span className="font-black text-2xl text-[#2563eb]">Detailor</span>
            <button onClick={() => setIsMenuOpen(false)} className="text-2xl">✕</button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${pathname === item.href ? 'bg-blue-50 text-[#2563eb]' : 'text-gray-400 hover:bg-gray-50'}`}>
                <span className="text-xl">{item.icon}</span> {item.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="mt-4 p-4 text-red-500 font-bold border-t">Sign Out</button>
        </div>
        <div className="flex-1 bg-black/20" onClick={() => setIsMenuOpen(false)} />
      </div>

      {/* 2. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full p-6">
        <div className="font-black text-2xl text-[#2563eb] mb-10">Detailor</div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-4 p-3 rounded-xl font-bold transition-all ${pathname === item.href ? 'bg-blue-50 text-[#2563eb]' : 'text-gray-400 hover:bg-gray-50'}`}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* TOP BAR WITH HAMBURGER */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 sticky top-0 z-30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-2xl p-2 bg-gray-50 rounded-lg">☰</button>
            <h1 className="font-black text-xl tracking-tight">Dashboard</h1>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#2563eb]">
            {businessName.charAt(0)}
          </div>
        </header>

        <main className="p-4 md:p-8 pb-32">
          {/* CONTENT (Stats, List, etc.) */}
          <div className="mb-8">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{businessName}</p>
            <h2 className="text-3xl font-black">Performance Overview</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <StatCard label="Total Revenue" value={`$${appointments.reduce((a, b) => a + Number(b.total_price || 0), 0)}`} />
             <StatCard label="Total Jobs" value={appointments.length.toString()} />
             <StatCard label="Avg. Ticket" value={`$${appointments.length > 0 ? Math.round(appointments.reduce((a, b) => a + Number(b.total_price || 0), 0) / appointments.length) : 0}`} />
             <StatCard label="New Leads" value="0" />
          </div>

          {/* ADD YOUR APPOINTMENT LIST MAP HERE */}
        </main>
      </div>

      <NewAppointmentDrawer />
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black">{value}</h4>
    </div>
  );
}