"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/settingsContext';
import {
  LayoutDashboard, BarChart3, Calendar, ClipboardList,
  Users, MessageSquare, Briefcase, Scissors, Camera,
  Settings, LogOut, Menu, X, Lock, Crown, ChevronRight, Store, Paintbrush,
  FileText, Zap, GitBranch
} from 'lucide-react';

// plan levels: essential=1, choice=2, exclusive=3
const LEVEL: Record<string, number> = { essential: 1, choice: 2, exclusive: 3 };

const NAV = [
  { group: 'Overview', items: [
    { label: 'Dashboard',    href: '/dashboard',               icon: LayoutDashboard, plan: 'essential' },
    { label: 'Analytics',    href: '/dashboard/analytics',     icon: BarChart3,       plan: 'essential' },
    { label: 'Calendar',     href: '/dashboard/calendar',      icon: Calendar,        plan: 'essential' },
  ]},
  { group: 'Operations', items: [
    { label: 'Appointments', href: '/dashboard/appointments',  icon: ClipboardList,   plan: 'essential' },
    { label: 'Customers',    href: '/dashboard/customers',     icon: Users,           plan: 'choice'    },
    { label: 'Messages',     href: '/dashboard/messages',      icon: MessageSquare,   plan: 'choice'    },
    { label: 'Invoices',     href: '/dashboard/invoices',      icon: FileText,        plan: 'essential' },
    { label: 'Operators',    href: '/dashboard/staffs',        icon: Briefcase,       plan: 'essential' },
  ]},
  { group: 'Growth', items: [
    { label: 'Automations',  href: '/dashboard/automations',   icon: Zap,             plan: 'choice'    },
    { label: 'Workflows',    href: '/dashboard/workflows',     icon: GitBranch,       plan: 'choice'    },
  ]},
  { group: 'Assets', items: [
    { label: 'Service Menu',  href: '/dashboard/services',     icon: Scissors,     plan: 'choice'    },
    { label: 'Lookbook',      href: '/dashboard/gallery',      icon: Camera,       plan: 'choice'    },
    { label: 'Page Designer', href: '/dashboard/designer',     icon: Paintbrush,   plan: 'essential' },
    { label: 'Settings',      href: '/dashboard/settings',     icon: Settings,     plan: 'essential' },
  ]},
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('');
  const [plan, setPlan] = useState('essential');
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();

  const bizName   = settings.business_name || 'My Business';
  const themeColor = settings.theme_color  || '#2563eb';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.push('/login');
      supabase.from('profiles').select('role, plan').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setRole(data.role || 'owner');
            setPlan(data.plan || 'essential');
          }
        });
    });
  }, [router]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const has = (req: string) => (LEVEL[plan] ?? 1) >= (LEVEL[req] ?? 1);

  const activePage = NAV.flatMap(g => g.items).find(i =>
    pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href))
  );

  const planBadge = plan === 'exclusive'
    ? 'bg-violet-100 text-violet-600 border-violet-200'
    : plan === 'choice'
    ? 'bg-blue-100 text-blue-600 border-blue-200'
    : 'bg-gray-100 text-gray-500 border-gray-200';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* overlay */}
      {open && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-black text-gray-900 tracking-tight">Detailor</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${planBadge}`}>
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {NAV.map(g => (
            <div key={g.group}>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const locked = !has(item.plan);

                  if (locked) {
                    return (
                      <Link key={item.href} href="/dashboard/pricing"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-50 transition-colors group">
                        <Icon size={14} className="text-gray-200 flex-shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        <Lock size={10} className="text-gray-200" />
                      </Link>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive ? 'text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      style={isActive ? { backgroundColor: themeColor } : {}}>
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight size={11} className="opacity-40" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade pill */}
        {plan !== 'exclusive' && (
          <div className="px-3 pb-3">
            <Link href="/dashboard/pricing"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
              <Crown size={13} />
              <div>
                <p className="font-bold leading-tight">Upgrade Plan</p>
                <p className="text-white/70 text-[10px]">Unlock all features</p>
              </div>
            </Link>
          </div>
        )}

        {/* User */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-xl mb-1">
            <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: themeColor }}>
              {bizName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{bizName}</p>
              <p className="text-[10px] text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
              <Menu size={16} className="text-gray-600" />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 text-sm">
              <Store size={12} className="text-gray-300" />
              <span className="text-gray-400 text-xs">{bizName}</span>
              <span className="text-gray-200">›</span>
              <span className="font-semibold text-gray-700 text-sm">{activePage?.label ?? 'Dashboard'}</span>
            </div>
            <span className="lg:hidden font-semibold text-gray-900 text-sm">{activePage?.label ?? 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-600">Online</span>
            </div>
            <div className="w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: themeColor }}>
              {bizName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 flex items-center justify-around px-2 py-2 safe-area-pb">
          {[
            { href: '/dashboard',              icon: LayoutDashboard, label: 'Home'     },
            { href: '/dashboard/appointments', icon: ClipboardList,   label: 'Jobs'     },
            { href: '/dashboard/calendar',     icon: Calendar,        label: 'Calendar' },
            { href: '/dashboard/customers',    icon: Users,           label: 'Clients'  },
            { href: '/dashboard/settings',     icon: Settings,        label: 'Settings' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors">
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'}
                  style={isActive ? { color: themeColor } : {}} />
                <span className={`text-[9px] font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                  style={isActive ? { color: themeColor } : {}}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}