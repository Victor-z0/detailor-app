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
      
      if (!user) {
        return router.push('/login');
      }

      const { data } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setBusinessName(data.business_name);
      }
      setLoading(false);
    }
    getProfile();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center text-gray-500 font-medium">
        Loading Detailor...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-black">Detailor</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem label="Dashboard" active />
          <NavItem label="Appointments" />
          <NavItem label="Inventory" />
          <NavItem label="Customers" />
          <NavItem label="Settings" />
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-4 border-t border-gray-100">
           <p className="text-[10px] uppercase tracking-wider text-gray-400 px-2 mb-1 font-bold">Logged in as</p>
           <p className="text-sm font-semibold px-2 truncate text-gray-900 mb-4">{businessName || 'My Shop'}</p>
           
           <button 
             onClick={handleSignOut}
             className="w-full text-left px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all group flex items-center gap-2"
           >
             <span>Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area - Offset by sidebar width */}
      <main className="flex-1 flex flex-col ml-64">
        {/* Top Header/Search */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Search appointments..." 
              className="w-full bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none text-black"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-sm">
              + New Appointment
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              <p className="text-gray-500 text-sm">Real-time stats for {businessName}.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Revenue" value="$0.00" change="+0%" />
            <StatCard label="Appointments" value="0" change="Upcoming" />
            <StatCard label="Avg. Ticket" value="$0" />
            <StatCard label="Invoices" value="0" />
          </div>

          {/* Recent Appointments Table Placeholder */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Appointments</h3>
              <button className="text-xs text-brand font-bold hover:underline">View All</button>
            </div>
            <div className="p-20 text-center text-gray-400">
              <div className="mb-4 text-3xl">🗓️</div>
              <p className="text-sm">No appointments scheduled yet.</p>
              <button className="mt-4 text-brand font-bold text-sm hover:text-brand-hover transition-colors">
                Schedule your first job
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Component for Sidebar Items
function NavItem({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <div className={`flex items-center px-3 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
      active 
        ? 'bg-gray-100 text-brand' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}>
      {label}
    </div>
  );
}

// Helper Component for Stat Cards
function StatCard({ label, value, change }: { label: string, value: string, change?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline justify-between mt-3">
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        {change && (
          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">
            {change}
          </span>
        )}
      </div>
    </div>
  );
}