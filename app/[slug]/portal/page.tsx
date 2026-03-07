"use client";

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LogOut, Calendar, Car, History, Plus, Zap, ArrowRight, ShieldCheck
} from 'lucide-react';

// 1. Define strict props for Next.js 16 compiler
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CustomerPortal({ params }: PageProps) {
  // 2. Resolve params using the React 'use' hook (Standard for Next.js 15/16)
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'booking' | 'history'>('history');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      if (user.email) await fetchCustomerHistory(user.email);
    }
    setLoading(false);
  }

  async function fetchCustomerHistory(email: string) {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_email', email)
      .order('scheduled_time', { ascending: false });
    setAppointments(data || []);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // Hard reset for vault security
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative mb-6">
        <Zap className="text-black animate-pulse" size={32} />
        <div className="absolute inset-0 bg-black/5 animate-ping rounded-full" />
      </div>
      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 italic">authorizing_vault_access...</div>
    </div>
  );

  if (!user) return <LoginView businessSlug={slug} />;

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-32 selection:bg-black selection:text-white">
      
      {/* HEADER: Minimalist identity */}
      <nav className="p-8 flex justify-between items-center max-w-2xl mx-auto border-b border-gray-50 mb-8">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter lowercase leading-none">vault_records</h1>
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 mt-2 italic">{user.email}</p>
        </div>
        <button 
          onClick={handleSignOut} 
          className="p-4 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
        >
          <LogOut size={18} />
        </button>
      </nav>

      <main className="max-w-xl mx-auto px-6">
        {view === 'history' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end px-2">
              <h2 className="text-5xl font-black italic tracking-tightest lowercase">history.</h2>
              <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest mb-2 italic">{appointments.length} services_logged</span>
            </header>

            <div className="space-y-6">
              {appointments.length > 0 ? appointments.map((apt, index) => (
                <div 
                  key={apt.id} 
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="p-8 rounded-[3rem] border border-gray-100 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 group hover:border-black transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full ${apt.status === 'Completed' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>
                      {apt.status}
                    </span>
                    <p className="font-black tabular-nums text-2xl group-hover:translate-x-[-4px] transition-transform">${apt.total_price}</p>
                  </div>
                  
                  <h3 className="text-3xl font-black italic lowercase mb-8 tracking-tightest leading-none">{apt.service_name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-8">
                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      <Calendar size={14} className="text-black" /> {new Date(apt.scheduled_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      <Car size={14} className="text-black" /> {apt.vehicle_make_model}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center border-2 border-dashed border-gray-50 rounded-[4rem]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-200 italic">No_Historical_Records_Found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <BookingFlow slug={slug} />
        )}
      </main>

      {/* FLOATING HUD NAV */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-100 px-12 py-6 rounded-[3rem] flex items-center gap-16 shadow-2xl z-50 animate-in slide-in-from-bottom-10 duration-1000">
        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-2 transition-all active:scale-90 ${view === 'history' ? 'text-black opacity-100' : 'text-gray-200 opacity-40 hover:opacity-60'}`}
        >
          <History size={20} strokeWidth={3} />
          <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
        </button>
        
        <button 
          onClick={() => setView('booking')}
          className={`flex flex-col items-center gap-2 transition-all active:scale-90 ${view === 'booking' ? 'text-black opacity-100' : 'text-gray-200 opacity-40 hover:opacity-60'}`}
        >
          <Plus size={20} strokeWidth={3} />
          <span className="text-[8px] font-black uppercase tracking-widest">Session</span>
        </button>
      </div>
    </div>
  );
}

// 3. Login View with sanitized Magic Link Logic
function LoginView({ businessSlug }: { businessSlug: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: { emailRedirectTo: `${window.location.origin}/book/${businessSlug}/portal` }
    });
    setLoading(false);
    if (!error) setSent(true);
    else alert("Protocol_Error: Verify digital address.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white selection:bg-black selection:text-white">
      <div className="max-w-md w-full">
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-black rounded-[3rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl animate-in zoom-in-75 duration-500">
            <ShieldCheck size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl font-black italic tracking-tightest lowercase mb-4">vault_entry.</h1>
          <p className="text-[11px] font-black text-gray-200 uppercase tracking-[0.4em] italic">encrypted_history_access</p>
        </div>
        
        {!sent ? (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <input 
              type="email" 
              placeholder="enter_verified_email"
              className="w-full p-8 bg-gray-50 rounded-[2.5rem] border-none font-black text-center outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all text-sm placeholder:text-gray-200 shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="w-full py-9 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
              {loading ? <Zap size={16} className="animate-spin" /> : 'request_access_link'}
            </button>
          </form>
        ) : (
          <div className="p-12 bg-black text-white rounded-[3.5rem] animate-in zoom-in-95 duration-500 text-center shadow-2xl">
            <Zap className="mx-auto mb-8 text-yellow-400 animate-pulse" size={40} />
            <p className="text-[11px] font-black uppercase tracking-[0.5em] leading-relaxed italic">
              Magic Link Dispatched.<br/>Check your inbox to unlock.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingFlow({ slug }: { slug: string }) {
    return (
        <div className="py-32 px-4 text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Zap className="text-black" size={32} />
              <div className="absolute inset-0 border-2 border-black/5 rounded-full animate-ping" />
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-200 uppercase tracking-[0.5em] italic">express_mode_ready</p>
              <h3 className="text-4xl font-black italic lowercase tracking-tightest leading-none">Initiate new session?</h3>
            </div>
            <button 
                onClick={() => window.location.href = `/book/${slug}`}
                className="w-full py-11 bg-black text-white rounded-[3rem] font-black uppercase text-[11px] tracking-[0.5em] shadow-2xl flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-95 transition-all group"
            >
                Secure Slot <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </div>
    );
}