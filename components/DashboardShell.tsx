"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Zap, BarChart3, Calendar, Layers, Users,
  Briefcase, Scissors, Camera, Settings, LogOut,
  Menu, X, Store, ChevronRight, MessageSquare
} from 'lucide-react';

const navGroups = [
  {
    group: "Core",
    items: [
      { label: 'Mainframe', href: '/dashboard', icon: Zap },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    ]
  },
  {
  group: "Operations",
  items: [
    { label: 'Appointments', href: '/dashboard/appointments', icon: Layers },
    { label: 'Customers', href: '/dashboard/customers', icon: Users },
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { label: 'Operators', href: '/dashboard/staffs', icon: Briefcase },
  ]
},
  {
    group: "Assets",
    items: [
      { label: 'Service Menu', href: '/dashboard/services', icon: Scissors },
      { label: 'Lookbook', href: '/dashboard/gallery', icon: Camera },
      { label: 'System Settings', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState('studio');
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, role')
        .eq('id', user.id)
        .single();
      if (profile) {
        setBusinessName(profile.business_name || 'studio');
        setRole(profile.role || 'staff');
      }
    }
    loadProfile();
  }, [router]);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-8 pb-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black italic tracking-tightest lowercase leading-none">studio_os.</h1>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                <p className="text-[8px] font-black uppercase tracking-[0.35em] text-gray-300">{role}_active</p>
              </div>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="lg:hidden p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"><X size={16} /></button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-6 space-y-8">
          {navGroups.map((group) => (
            <div key={group.group}>
              <p className="text-[8px] font-black text-gray-200 tracking-[0.35em] mb-3 px-3 uppercase italic">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 group relative ${isActive ? 'bg-black text-white shadow-lg shadow-black/15' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}>
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={10} className="ml-auto opacity-50" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-6 border-t border-gray-50">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl mb-3">
            <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">{businessName.charAt(0).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 truncate">terminal</p>
              <p className="text-[10px] font-black lowercase truncate">{businessName}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl">
            <LogOut size={13} /> terminate_session
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-50 flex items-center justify-between px-6 lg:px-10 sticky top-0 bg-white/90 backdrop-blur-xl z-30">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"><Menu size={18} /></button>
          <div className="hidden lg:flex items-center gap-3">
            <Store size={11} className="text-gray-300" />
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-gray-300">{businessName}_terminal</span>
            <span className="text-gray-200">·</span>
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-black">
              {navGroups.flatMap(g => g.items).find(i => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">online</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-black/10">{businessName.charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}