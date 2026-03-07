"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Car, Calendar, Clock, CheckCircle2, 
  LogOut, ChevronRight, Zap, 
  ShieldCheck, ArrowRight, User,
  FileText, Star, CreditCard
} from 'lucide-react';

export default function ClientVault() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getVaultData() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // 🛡️ SECURITY: Only fetch appointments matching the logged-in user's email
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('*')
        .eq('customer_email', user.email)
        .order('scheduled_time', { ascending: false });

      setBookings(appointmentData || []);
      setLoading(false);
    }

    getVaultData();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Zap className="animate-pulse text-black" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 text-gray-400">accessing_client_vault</p>
    </div>
  );

  const upcoming = bookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled');
  const past = bookings.filter(b => b.status === 'Completed');

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-black selection:text-white pb-20">
      
      {/* --- DASHBOARD HEADER --- */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex justify-between items-start mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic">client_member_portal</span>
            </div>
            <h1 className="text-6xl font-black italic tracking-tightest lowercase leading-[0.9]">
              The Vault.
            </h1>
          </div>
          <button onClick={handleSignOut} className="p-4 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-all group">
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* --- MAIN CONTENT: SERVICE RECORDS --- */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* NEXT PROTOCOL */}
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2 italic text-gray-400 border-b border-gray-100 pb-4">
                upcoming_appointments
              </h2>
              
              {upcoming.length > 0 ? (
                <div className="space-y-6">
                  {upcoming.map((booking) => (
                    <div key={booking.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:border-black transition-all group">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <div className={`inline-block px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-4 ${
                            booking.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {booking.status}
                          </div>
                          <h3 className="text-4xl font-black italic tracking-tighter lowercase">{booking.service_name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Fee</p>
                          <p className="font-black tracking-tighter text-3xl">${booking.total_price}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl"><Car size={20} strokeWidth={1.5} /></div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vehicle</p>
                            <p className="text-xs font-black uppercase tracking-widest">{booking.vehicle_make_model}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl"><Calendar size={20} strokeWidth={1.5} /></div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Deployment</p>
                            <p className="text-xs font-black uppercase tracking-widest">
                                {new Date(booking.scheduled_time).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] p-24 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck size={24} className="text-gray-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No active maintenance logs</p>
                </div>
              )}
            </section>

            {/* SERVICE HISTORY */}
            {past.length > 0 && (
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic text-gray-400">service_history</h2>
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  {past.map((booking, i) => (
                    <div key={booking.id} className={`p-10 flex items-center justify-between hover:bg-gray-50 transition-all ${i !== past.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="flex items-center gap-8">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                          <CheckCircle2 size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 italic">
                            {new Date(booking.scheduled_time).toLocaleDateString()}
                          </p>
                          <p className="text-lg font-black italic tracking-tight lowercase">{booking.service_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* --- SIDEBAR: MANIFEST & SUPPORT --- */}
          <div className="space-y-8">
            <div className="bg-black text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <Zap className="absolute -right-8 -top-8 text-white/5" size={160} />
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-12 text-gray-500 italic underline underline-offset-8 decoration-gray-800">member_profile</h3>
                <div className="space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-gray-400">
                        <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Account Owner</p>
                      <p className="text-xs font-bold truncate lowercase">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[3rem] p-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic text-gray-400">Concierge</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest mb-10">
                Reschedule your protocol or inquire about paint protection.
              </p>
              <button className="w-full py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl">
                Contact Studio
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
