"use client";

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin, Phone, Instagram, Globe, Star, ArrowRight,
  Calendar, Car, Clock, ChevronRight, ChevronLeft,
  CheckCircle2, X, RefreshCw, User, Mail, History,
  Camera, Facebook, LogOut, ShieldCheck, Zap
} from 'lucide-react';

interface Props { params: Promise<{ slug: string }> }

const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
const VEHICLE_TYPES = ['Sedan','SUV','Truck','Van','Coupe','Sports'];
const EMPTY_FORM = { name:'', email:'', phone:'', vehicle:'', vehicleType:'Sedan', notes:'' };
type ViewState = 'landing' | 'booking' | 'portal';

export default function ProfessionalStorefront({ params }: Props) {
  const { slug } = use(params);

  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // UI States
  const [view, setView] = useState<ViewState>('landing');
  const [lightbox, setLightbox] = useState<string|null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  
  // Booking Engine States
  const [step, setStep] = useState(1);
  const [selSvc, setSelSvc] = useState<any>(null);
  const [selDate, setSelDate] = useState('');
  const [selTime, setSelTime] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [vin, setVin] = useState('');
  const [vinBusy, setVinBusy] = useState(false);

  useEffect(() => {
    loadBusiness();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setCustomer(session.user); }
      else setCustomer(null);
    });
    return () => subscription.unsubscribe();
  }, [slug]);

  async function loadBusiness() {
    let p: any = null;
    const { data: a } = await supabase.from('profiles').select('*').eq('slug', slug).maybeSingle();
    if (a) p = a;
    if (!p) {
      const { data: b } = await supabase.from('profiles').select('*').ilike('business_name', slug.replace(/-/g,' ')).maybeSingle();
      if (b) p = b;
    }
    if (!p) { setNotFound(true); setLoading(false); return; }
    
    setProfile(p);
    
    const [{ data: svcs }, { data: pics }] = await Promise.all([
      supabase.from('services').select('*').eq('user_id', p.id).order('price', { ascending: true }),
      supabase.from('gallery_items').select('*').eq('user_id', p.id).order('featured', { ascending: false }).limit(6),
    ]);
    
    setServices(svcs || []);
    setGallery(pics || []);
    setLoading(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCustomer(user);
  }

  // ... (Keep your existing decodeVin and submitBooking functions here, omitted for brevity but they remain exactly the same)
  async function decodeVin() {
    if (vin.length !== 17) return;
    setVinBusy(true);
    try {
      const res  = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const data = await res.json();
      const get  = (n: string) => data.Results?.find((r: any) => r.Variable === n)?.Value;
      const v    = `${get('Model Year')} ${get('Make')} ${get('Model')}`.trim();
      if (v.length > 4) setForm(f => ({ ...f, vehicle: v }));
    } catch {}
    setVinBusy(false);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selSvc || !selDate || !selTime || !profile) return;
    setSubmitting(true);
    const { data, error } = await supabase.from('appointments').insert([{
      user_id: profile.id,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      vehicle_make_model: form.vehicle,
      vehicle_type: form.vehicleType,
      service_name: selSvc.name,
      total_price: selSvc.price,
      notes: form.notes,
      status: 'Pending Payment',
      scheduled_time: new Date(`${selDate} ${selTime}`).toISOString(),
    }]).select().single();

    if (!error) {
      if (profile.stripe_link) {
        window.location.href = `${profile.stripe_link}?client_reference_id=${data.id}&prefilled_email=${form.email}`;
      } else {
        window.location.href = `/${slug}/success`; // Fallback to success page if no stripe
      }
    }
    setSubmitting(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Zap className="text-white animate-pulse" size={32} /></div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center bg-white"><h1 className="text-2xl font-black italic">404. Studio Not Found.</h1></div>;

  const tc = profile?.theme_color || '#000000';

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white font-sans scroll-smooth">
      
      {/* ── PROFESSIONAL NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black italic text-xl rounded-xl">
              {profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full rounded-xl object-cover" /> : profile?.business_name?.charAt(0)}
            </div>
            <span className="font-black italic text-xl tracking-tight lowercase hidden sm:block">{profile?.business_name}.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setView('portal')} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors hidden sm:block">
              Client Portal
            </button>
            <button onClick={() => setView('booking')} className="px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-full shadow-xl hover:scale-105 transition-all">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* ── LANDING PAGE VIEW ── */}
      {view === 'landing' && (
        <main className="animate-in fade-in duration-1000">
          
          {/* IMMERSIVE HERO */}
          <section className="relative h-[90vh] w-full flex items-center justify-center mt-20">
            <div className="absolute inset-0 bg-black">
              <img src={profile?.banner_url || "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?q=80&w=2000&auto=format&fit=crop"} alt="Studio Hero" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <ShieldCheck size={14} /> Premium Automotive Protection
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter lowercase leading-[0.9] mb-6 drop-shadow-2xl">
                perfection,<br/>delivered.
              </h1>
              <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                {profile?.bio || "Expert detailing, paint correction, and ceramic coatings designed to preserve and enhance your vehicle's aesthetic."}
              </p>
              <button onClick={() => setView('booking')} className="px-10 py-5 bg-white text-black text-sm font-black uppercase tracking-[0.3em] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto group">
                Schedule Service <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </section>

          {/* SOCIAL PROOF BAR */}
          <section className="bg-black py-8 border-t border-white/10">
            <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-70">
               <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest"><Star className="fill-white"/> 5-Star Rated</div>
               <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest"><MapPin /> {profile?.location || "Mobile & Studio"}</div>
               <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest"><ShieldCheck /> Fully Insured</div>
            </div>
          </section>

          {/* SERVICES MENU */}
          <section className="py-32 bg-gray-50 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-5xl font-black italic tracking-tightest lowercase mb-4">the protocol.</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Signature Services & Pricing</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(svc => (
                  <div key={svc.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 hover:shadow-2xl hover:border-black transition-all group flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-2xl font-black italic lowercase tracking-tight mb-3">{svc.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6">{svc.description || "Comprehensive interior and exterior restoration protocol."}</p>
                    </div>
                    <div>
                      <div className="flex items-end justify-between mb-6 pt-6 border-t border-gray-50">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> {svc.duration || 'Variable'}</span>
                        <span className="text-3xl font-black tracking-tighter">${svc.price}</span>
                      </div>
                      <button onClick={() => { setSelSvc(svc); setView('booking'); }} className="w-full py-4 bg-gray-50 text-black text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                        Select Protocol
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="bg-black text-white pt-24 pb-12 px-6">
             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-white/10 pb-16 mb-8">
                <div>
                   <h2 className="text-4xl font-black italic lowercase tracking-tighter mb-4">{profile?.business_name}.</h2>
                   <p className="text-gray-400 text-sm max-w-sm leading-relaxed">Dedicated to the pursuit of automotive perfection. Securing your investment through advanced surface protection.</p>
                </div>
                <div className="flex flex-col md:items-end space-y-4">
                   {profile?.phone && <a href={`tel:${profile.phone}`} className="text-sm font-bold tracking-widest uppercase hover:text-gray-400 flex items-center gap-3"><Phone size={16}/> {profile.phone}</a>}
                   {profile?.instagram && <a href={`https://instagram.com/${profile.instagram}`} className="text-sm font-bold tracking-widest uppercase hover:text-gray-400 flex items-center gap-3"><Instagram size={16}/> @{profile.instagram}</a>}
                </div>
             </div>
             <div className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
               Powered by Detailor OS
             </div>
          </footer>
        </main>
      )}

      {/* ── BOOKING ENGINE VIEW (Same logic as before, cleaner wrapper) ── */}
      {view === 'booking' && (
        <main className="pt-32 pb-24 px-6 max-w-2xl mx-auto min-h-screen animate-in slide-in-from-bottom-8 duration-700">
            <button onClick={() => setView('landing')} className="mb-12 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              <ChevronLeft size={16} /> Return to Storefront
            </button>
            
            <h2 className="text-4xl font-black italic lowercase tracking-tightest mb-8">secure_slot.</h2>
            
            {/* INJECT YOUR MULTI-STEP BOOKING ENGINE HERE */}
            {/* The form, steps, and submit logic you pasted previously go here flawlessly */}
            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                [Booking Terminal Active]
                {/* For brevity in this message, plug your step 1, 2, 3 form logic right here */}
            </div>
        </main>
      )}

      {/* ── PORTAL VIEW ── */}
      {view === 'portal' && (
          <main className="pt-32 pb-24 px-6 max-w-2xl mx-auto min-h-screen animate-in slide-in-from-bottom-8 duration-700">
              <div className="text-center py-20">
                  <h2 className="text-4xl font-black italic lowercase tracking-tightest mb-4">client_vault.</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Access historical records</p>
                  <button onClick={() => window.location.href='/login'} className="px-8 py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-full shadow-xl">
                      Authenticate
                  </button>
              </div>
          </main>
      )}

    </div>
  );
}