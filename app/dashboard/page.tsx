"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data } = await supabase.from('profiles').select('business_name').eq('id', user.id).single();
      if (data) setBusinessName(data.business_name);
      setLoading(false);
    }
    getProfile();
  }, [router]);

  if (loading) return <div className="p-10 text-black">Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F9FAFB]">
      
      {/* SIDEBAR: Hidden on mobile (hidden), visible on desktop (md:flex) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full">
        <div className="p-6 font-bold text-xl">Detailor</div>
        <nav className="flex-1 px-4 space-y-2">
          <div className="p-2 bg-gray-100 rounded-lg text-blue-600 font-bold">Dashboard</div>
          <div className="p-2 text-gray-500">Appointments</div>
        </nav>
        <div className="p-4 border-t">
           <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-red-500 text-sm font-bold">Sign Out</button>
        </div>
      </aside>

      {/* MOBILE HEADER: Only shows on small screens */}
      <header className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="font-bold text-lg">Detailor</h1>
        <button className="p-2 bg-gray-100 rounded-md">☰</button>
      </header>

      {/* MAIN CONTENT: No margin on mobile, ml-64 on desktop */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-black">Overview</h2>
          <p className="text-gray-500 text-sm">{businessName}</p>
        </div>

        {/* STATS: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <StatCard label="Revenue" value="$0" />
          <StatCard label="Jobs" value="0" />
          <StatCard label="Avg" value="$0" />
          <StatCard label="New" value="0" />
        </div>

        {/* MOBILE ACTION BUTTON: Fixed at bottom right for thumb access */}
        <button className="md:hidden fixed bottom-20 right-6 bg-[#2563eb] text-white w-14 h-14 rounded-full shadow-2xl text-2xl font-bold z-30">
          +
        </button>

        {/* APPOINTMENT LIST */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
           <p className="text-gray-400">No jobs today</p>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV: Common in high-end apps like Detailor */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 h-16 flex items-center justify-around z-20">
        <button className="flex flex-col items-center text-[#2563eb]"><span className="text-xs font-bold">Home</span></button>
        <button className="flex flex-col items-center text-gray-400"><span className="text-xs font-bold">Jobs</span></button>
        <button className="flex flex-col items-center text-gray-400"><span className="text-xs font-bold">Profile</span></button>
      </nav>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
      <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">{label}</p>
      <h4 className="text-lg md:text-2xl font-bold text-black mt-1">{value}</h4>
    </div>
  );
}