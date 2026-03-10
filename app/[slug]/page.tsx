"use client";
import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  MapPin, Phone, Instagram, Globe, Star, ArrowRight, ArrowLeft,
  Calendar, Car, Clock, ChevronRight, ChevronLeft,
  CheckCircle2, X, RefreshCw, User, Mail, History,
  Camera, Facebook, LogOut, ShieldCheck, Zap, BookOpen,
  CheckCheck
} from 'lucide-react';

interface Props { params: Promise<{ slug: string }> }

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const TIMES   = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
const VTYPES  = ['Sedan','SUV','Truck','Van','Coupe','Sports'];
const EMPTY   = { name:'', email:'', phone:'', vehicle:'', vehicleType:'Sedan', notes:'' };
type View = 'landing' | 'booking' | 'portal';

export default function Storefront({ params }: Props) {
  const { slug }    = use(params);
  const searchParams = useSearchParams();

  const [profile,    setProfile]    = useState<any>(null);
  const [services,   setServices]   = useState<any[]>([]);
  const [gallery,    setGallery]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [view,       setView]       = useState<View>('landing');
  const [lightbox,   setLightbox]   = useState<string|null>(null);
  const [customer,   setCustomer]   = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [authBusy,   setAuthBusy]   = useState(false);

  // Booking engine
  const [step,       setStep]       = useState(1);
  const [selSvc,     setSelSvc]     = useState<any>(null);
  const [selDate,    setSelDate]    = useState('');
  const [selTime,    setSelTime]    = useState('');
  const [form,       setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [booked,     setBooked]     = useState(false);
  const [vin,        setVin]        = useState('');
  const [vinBusy,    setVinBusy]    = useState(false);

  // Check URL param on mount
  useEffect(() => {
    if (searchParams.get('view') === 'portal') setView('portal');
  }, [searchParams]);

  useEffect(() => {
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setCustomer(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [slug]);

  async function load() {
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
      supabase.from('services').select('*').eq('user_id', p.id).order('price'),
      supabase.from('gallery_items').select('*').eq('user_id', p.id).order('featured',{ ascending:false }).limit(9),
    ]);
    setServices(svcs || []);
    setGallery(pics || []);
    setLoading(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCustomer(user);
  }

  useEffect(() => {
    if (customer && profile) {
      supabase.from('appointments').select('*')
        .eq('customer_email', customer.email).eq('user_id', profile.id)
        .order('scheduled_time', { ascending: false })
        .then(({ data }) => setMyBookings(data || []));
    }
  }, [customer, profile]);

  async function signIn() {
    setAuthBusy(true);
    await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${window.location.origin}/${slug}?view=portal` } });
  }

  async function decodeVin() {
    if (vin.length !== 17) return;
    setVinBusy(true);
    try {
      const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const d = await r.json();
      const g = (n: string) => d.Results?.find((x: any) => x.Variable === n)?.Value;
      const v = `${g('Model Year')} ${g('Make')} ${g('Model')}`.trim();
      if (v.length > 4) setForm(f => ({ ...f, vehicle: v }));
    } catch {}
    setVinBusy(false);
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!selSvc || !selDate || !selTime || !profile) return;
    setSubmitting(true);

    // Parse "9:00 AM" / "1:30 PM" reliably
    function parseTime12(t: string) {
      const [time, meridiem] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return { h, m };
    }
    const { h, m } = parseTime12(selTime);
    const dt = new Date(selDate);
    dt.setHours(h, m, 0, 0);

    const { error } = await supabase.from('appointments').insert([{
      user_id:            profile.id,
      customer_name:      form.name,
      customer_email:     form.email,
      customer_phone:     form.phone,
      vehicle_info:       form.vehicle,
      vehicle_make_model: form.vehicle,
      vehicle_type:       form.vehicleType,
      service_type:       selSvc.name,
      service_name:       selSvc.name,
      total_price:        selSvc.price,
      notes:              form.notes,
      status:             'Confirmed',
      source:             'public_booking',
      scheduled_time:     dt.toISOString(),
    }]);
    if (!error) {
      if (profile.stripe_link) {
        window.location.href = `${profile.stripe_link}?prefilled_email=${encodeURIComponent(form.email)}`;
      } else {
        setBooked(true);
      }
    } else {
      alert(`Booking failed: ${error.message}`);
    }
    setSubmitting(false);
  }

  function resetBooking() {
    setBooked(false); setStep(1); setSelSvc(null);
    setSelDate(''); setSelTime(''); setForm(EMPTY); setView('landing');
  }

  const tc = profile?.theme_color || '#000000';

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Zap className="text-white animate-pulse" size={28} />
    </div>
  );

  // ── 404 ──────────────────────────────────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-black italic text-gray-900">404. Studio Not Found.</h1>
      <p className="text-sm text-gray-400 mt-2">Check the link and try again.</p>
    </div>
  );

  // ── Booking success ───────────────────────────────────────────────────────
  if (booked) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6 py-20 max-w-sm mx-auto">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${tc}18` }}>
        <CheckCircle2 size={48} style={{ color: tc }} />
      </div>
      <h1 className="text-3xl font-black italic text-gray-900 mb-2">You're booked.</h1>
      <p className="text-gray-400 text-sm mb-1">{selSvc?.name} · {selTime}</p>
      <p className="text-gray-300 text-xs mb-10">Confirmation sent to {form.email}</p>
      <button onClick={() => { setView('portal'); setBooked(false); }}
        className="w-full py-4 text-white font-bold text-sm rounded-2xl mb-3 flex items-center justify-center gap-2 hover:opacity-90"
        style={{ backgroundColor: tc }}>
        View My Bookings <ArrowRight size={15} />
      </button>
      <button onClick={resetBooking} className="text-sm text-gray-400 hover:text-gray-700">← Back to {profile?.business_name}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">

      {/* ═══════════════════ FIXED NAVBAR ═══════════════════ */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{ backgroundColor: tc }}>
              {(profile?.avatar_url || profile?.logo_url)
                ? <img src={profile.avatar_url || profile.logo_url} className="w-full h-full object-cover" alt="" />
                : profile?.business_name?.charAt(0).toUpperCase()}
            </div>
            <span className="font-black italic text-lg tracking-tight hidden sm:block">{profile?.business_name}.</span>
          </button>

          <div className="flex items-center gap-3">
            {customer ? (
              <>
                <button onClick={() => setView('portal')}
                  className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors hidden sm:flex items-center gap-1.5">
                  <History size={12} /> My Bookings
                </button>
                <button onClick={async () => { await supabase.auth.signOut(); setCustomer(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <LogOut size={15} className="text-gray-400" />
                </button>
              </>
            ) : (
              <button onClick={() => setView('portal')}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors hidden sm:block">
                Client Portal
              </button>
            )}
            <button onClick={() => setView('booking')}
              className="px-5 py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: tc }}>
              Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ LANDING ═══════════════════ */}
      {view === 'landing' && (
        <main>

          {/* HERO */}
          <section className="relative w-full pt-16" style={{ height: '100vh', minHeight: 500 }}>
            <div className="absolute inset-0 bg-black">
              {(profile?.cover_url || profile?.banner_url) ? (
                <img src={profile.cover_url || profile.banner_url} alt="" className="w-full h-full object-cover opacity-50" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(160deg, ${tc}40 0%, #000 100%)` }}>
                  <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${tc}25 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            </div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <ShieldCheck size={12} /> Premium Automotive Detailing
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
                {profile?.business_name || 'perfection,'}
                <br />
                <span className="text-3xl md:text-5xl opacity-80">delivered.</span>
              </h1>
              {profile?.bio && (
                <p className="text-gray-300 text-base md:text-lg max-w-xl mb-10 leading-relaxed">{profile.bio}</p>
              )}
              <button onClick={() => setView('booking')}
                className="px-10 py-5 bg-white text-black text-sm font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group">
                Schedule Service <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30">
              <div className="w-px h-8 bg-white animate-pulse" />
              <p className="text-white text-[9px] font-black uppercase tracking-widest">Scroll</p>
            </div>
          </section>

          {/* SOCIAL PROOF BAR */}
          <section className="bg-black py-6 border-t border-white/10">
            <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-6 opacity-60">
              <span className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                {[...Array(5)].map((_,i) => <Star key={i} size={11} className="fill-white" />)} 5-Star Rated
              </span>
              {profile?.location && <span className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest"><MapPin size={11} />{profile.location}</span>}
              <span className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest"><ShieldCheck size={11} /> Fully Insured</span>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{services.length} Services Available</span>
            </div>
          </section>

          {/* SERVICES */}
          {services.length > 0 && (
            <section className="py-16 px-4 sm:px-6 bg-gray-50">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-3">the protocol.</h2>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Services & Pricing</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.map(svc => (
                    <div key={svc.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 hover:shadow-2xl hover:border-black transition-all group flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-black italic tracking-tight mb-2">{svc.name}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{svc.description || 'Professional detailing service.'}</p>
                      </div>
                      <div className="mt-6">
                        <div className="flex items-end justify-between mb-5 pt-5 border-t border-gray-50">
                          {svc.duration && <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1"><Clock size={10} />{svc.duration}</span>}
                          <span className="text-3xl font-black tracking-tighter ml-auto">${svc.price}</span>
                        </div>
                        <button onClick={() => { setSelSvc(svc); setView('booking'); }}
                          className="w-full py-3.5 bg-gray-50 text-black text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                          Select Protocol
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* GALLERY */}
          {gallery.length > 0 && (
            <section className="py-16 px-4 sm:px-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-3">the work.</h2>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Recent Projects</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {gallery.map(item => (
                    <div key={item.id} onClick={() => setLightbox(item.image_url)}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer bg-gray-100 group">
                      <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CONTACT / HOURS */}
          {(profile?.phone || profile?.instagram || profile?.availability_json) && (
            <section className="py-12 px-4 sm:px-6 bg-gray-50">
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                  <h3 className="font-black italic text-lg mb-5">get in touch.</h3>
                  <div className="space-y-3">
                    {profile?.phone     && <a href={`tel:${profile.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors font-medium"><Phone size={14} className="text-gray-300" />{profile.phone}</a>}
                    {profile?.instagram && <a href={`https://instagram.com/${profile.instagram}`} target="_blank" className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors font-medium"><Instagram size={14} className="text-gray-300" />@{profile.instagram}</a>}
                    {profile?.facebook  && <a href={profile.facebook} target="_blank" className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors font-medium"><Facebook size={14} className="text-gray-300" />Facebook</a>}
                    {profile?.website   && <a href={profile.website} target="_blank" className="flex items-center gap-3 text-sm text-gray-600 hover:text-black transition-colors font-medium"><Globe size={14} className="text-gray-300" />{profile.website}</a>}
                  </div>
                </div>
                {profile?.availability_json && (
                  <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                    <h3 className="font-black italic text-lg mb-5 flex items-center gap-2"><Clock size={15} /> hours.</h3>
                    <div className="space-y-2">
                      {Object.entries(profile.availability_json).map(([day, hrs]: any) => {
                        // Handle new format: { enabled, start, end }
                        let display: string;
                        if (hrs && typeof hrs === 'object') {
                          if (!hrs.enabled) display = 'Closed';
                          else {
                            // Convert 24h to 12h
                            function fmt(t: string) {
                              const [h, m] = t.split(':').map(Number);
                              const ampm = h >= 12 ? 'PM' : 'AM';
                              const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                              return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
                            }
                            display = `${fmt(hrs.start)} - ${fmt(hrs.end)}`;
                          }
                        } else {
                          display = hrs as string;
                        }
                        return (
                          <div key={day} className="flex justify-between text-sm">
                            <span className="text-gray-400 font-medium">{day}</span>
                            <span className={`font-bold ${display === 'Closed' ? 'text-red-400' : 'text-gray-900'}`}>{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="bg-black text-white pt-16 pb-10 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/10 mb-8">
                <div>
                  <h2 className="text-3xl font-black italic tracking-tight mb-2">{profile?.business_name}.</h2>
                  <p className="text-gray-500 text-sm max-w-xs">Dedicated to the pursuit of automotive perfection.</p>
                </div>
                <button onClick={() => setView('booking')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all self-start md:self-end">
                  Book Now <ArrowRight size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">Powered by Detailor</p>
                <button onClick={() => setView('portal')} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 hover:text-white transition-colors">
                  Client Portal →
                </button>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* ═══════════════════ BOOKING ENGINE ═══════════════════ */}
      {view === 'booking' && (
        <main className="pt-20 pb-24 px-4 sm:px-6 min-h-screen">
          <div className="max-w-xl mx-auto">
            <button onClick={() => setView('landing')} className="mb-10 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              <ChevronLeft size={14} /> Return to Storefront
            </button>

            <h2 className="text-3xl font-black italic tracking-tighter mb-1">secure_slot.</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">No account required.</p>

            {/* Step dots */}
            <div className="flex items-center mb-10">
              {[{n:1,l:'Service'},{n:2,l:'Vehicle'},{n:3,l:'Schedule'},{n:4,l:'Details'}].map((s,i) => (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                      style={step >= s.n ? { backgroundColor: tc, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#cbd5e1' }}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <span className="text-[9px] font-black mt-1 uppercase tracking-wider" style={step >= s.n ? { color: '#374151' } : { color: '#d1d5db' }}>{s.l}</span>
                  </div>
                  {i < 3 && <div className="flex-1 h-px mx-2 mb-4" style={step > s.n ? { backgroundColor: tc } : { backgroundColor: '#f1f5f9' }} />}
                </div>
              ))}
            </div>

            <form onSubmit={submitBooking}>

              {/* Step 1: Service */}
              {step === 1 && (
                <div className="space-y-3">
                  {services.length === 0
                    ? <div className="py-16 text-center bg-gray-50 rounded-[2rem]"><p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No services listed yet.</p></div>
                    : services.map(svc => (
                      <div key={svc.id} onClick={() => setSelSvc(svc)}
                        className="flex items-center justify-between p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all"
                        style={selSvc?.id === svc.id ? { borderColor: tc, backgroundColor: `${tc}06` } : { borderColor: '#f1f5f9' }}>
                        <div>
                          <p className="font-black text-gray-900 italic">{svc.name}</p>
                          {svc.duration && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10} />{svc.duration}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="font-black text-xl tracking-tighter">${svc.price}</span>
                          {selSvc?.id === svc.id && <CheckCircle2 size={16} style={{ color: tc }} />}
                        </div>
                      </div>
                    ))}
                  <button type="button" disabled={!selSvc} onClick={() => setStep(2)}
                    className="w-full mt-4 py-4 text-white font-black text-xs uppercase tracking-widest rounded-full disabled:opacity-30 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: tc }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2: Vehicle */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Vehicle Info</p>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-black font-bold"><ChevronLeft size={12} />Back</button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Decode by VIN (optional)</label>
                    <div className="flex gap-2">
                      <input value={vin} onChange={e => setVin(e.target.value.toUpperCase())} maxLength={17} placeholder="17-digit VIN"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 font-mono uppercase tracking-widest" />
                      <button type="button" onClick={decodeVin} disabled={vin.length !== 17 || vinBusy}
                        className="px-5 py-3 text-white text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-40"
                        style={{ backgroundColor: tc }}>
                        {vinBusy ? <RefreshCw size={13} className="animate-spin" /> : 'Decode'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</label>
                    <input required value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="e.g. 2022 BMW M3"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {VTYPES.map(t => (
                        <button type="button" key={t} onClick={() => setForm(f => ({ ...f, vehicleType: t }))}
                          className="py-3 rounded-xl text-xs font-black border-2 uppercase tracking-wider transition-all"
                          style={form.vehicleType === t ? { borderColor: tc, color: tc, backgroundColor: `${tc}08` } : { borderColor: '#f1f5f9', color: '#9ca3af' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" disabled={!form.vehicle} onClick={() => setStep(3)}
                    className="w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-full disabled:opacity-30 hover:opacity-90"
                    style={{ backgroundColor: tc }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 3: Schedule */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Date & Time</p>
                    <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-black font-bold"><ChevronLeft size={12} />Back</button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                    <input type="date" required value={selDate} onChange={e => setSelDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIMES.map(t => (
                        <button type="button" key={t} onClick={() => setSelTime(t)}
                          className="py-3 rounded-xl text-xs font-black border-2 uppercase tracking-wider transition-all"
                          style={selTime === t ? { borderColor: tc, color: tc, backgroundColor: `${tc}08` } : { borderColor: '#f1f5f9', color: '#6b7280' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" disabled={!selDate || !selTime} onClick={() => setStep(4)}
                    className="w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-full disabled:opacity-30 hover:opacity-90"
                    style={{ backgroundColor: tc }}>
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 4: Details */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Your Details</p>
                    <button type="button" onClick={() => setStep(3)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-black font-bold"><ChevronLeft size={12} />Back</button>
                  </div>

                  {/* Summary */}
                  <div className="p-5 bg-black text-white rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-black uppercase tracking-wider">Service</span>
                      <span className="font-black italic">{selSvc?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-black uppercase tracking-wider">Vehicle</span>
                      <span className="font-bold text-gray-300">{form.vehicle || '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-black uppercase tracking-wider">When</span>
                      <span className="font-bold text-gray-300">{selDate && selTime ? `${new Date(`${selDate} ${selTime}`).toLocaleDateString('en-US',{month:'short',day:'numeric'})} · ${selTime}` : '—'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400 font-black uppercase tracking-wider text-xs">Total</span>
                      <span className="text-2xl font-black tracking-tighter">${selSvc?.price}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input required value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="Your name"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                      <input required value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="555-0000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                      <input required type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="you@email.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes (optional)</label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} rows={3} placeholder="Pet hair, stains, special requests…"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none" />
                    </div>
                  </div>

                  <button type="submit" disabled={submitting || !form.name || !form.email || !form.phone}
                    className="w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-full disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg hover:opacity-90"
                    style={{ backgroundColor: tc }}>
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {submitting ? 'Confirming…' : profile?.stripe_link ? 'Confirm & Pay Deposit' : 'Confirm Booking'}
                  </button>
                  <p className="text-center text-[10px] text-gray-300 font-black uppercase tracking-widest">No account required</p>
                </div>
              )}
            </form>
          </div>
        </main>
      )}

      {/* ═══════════════════ CLIENT VAULT / PORTAL ═══════════════════ */}
      {view === 'portal' && (
        <main className="min-h-screen bg-[#FDFDFD] pt-20 pb-20 selection:bg-black selection:text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12">

            {/* Vault header */}
            <div className="flex justify-between items-start mb-8 sm:mb-16">
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-gray-400 italic">client_member_portal</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter leading-[0.9]">The Vault.</h1>
                <p className="text-sm text-gray-400 mt-2 sm:mt-3 font-medium">{profile?.business_name}</p>
              </div>
              <button onClick={() => setView('landing')}
                className="flex items-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-gray-50 rounded-2xl hover:bg-black hover:text-white transition-all group text-sm font-bold">
                <ArrowLeft size={15} /> <span className="hidden sm:inline">Back</span>
              </button>
            </div>

            {!customer ? (
              /* Not signed in */
              <div className="text-center py-24 bg-white border border-gray-100 rounded-[3rem] shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} className="text-gray-200" />
                </div>
                <h2 className="text-2xl font-black italic mb-2">member_access.</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Sign in to view your booking history</p>
                <button onClick={signIn} disabled={authBusy}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-black text-sm rounded-full hover:bg-gray-50 hover:border-black transition-all shadow-sm">
                  {authBusy ? <RefreshCw size={15} className="animate-spin" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className="mt-6">
                  <button onClick={() => setView('booking')}
                    className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                    Or book an appointment →
                  </button>
                </div>
              </div>
            ) : (
              /* Signed in */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-10">

                {/* Main: appointments */}
                <div className="lg:col-span-2 space-y-10">

                  {/* Upcoming */}
                  <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic text-gray-400 border-b border-gray-100 pb-4">
                      upcoming_appointments
                    </h2>
                    {myBookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length > 0 ? (
                      <div className="space-y-5">
                        {myBookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').map(apt => (
                          <div key={apt.id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-black transition-all">
                            <div className="flex justify-between items-start mb-8">
                              <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 ${apt.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                  {apt.status}
                                </span>
                                <h3 className="text-3xl font-black italic tracking-tight">{apt.service_name || apt.service_type}</h3>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Fee</p>
                                <p className="text-2xl font-black tracking-tighter">${apt.total_price}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5 pt-5 border-t border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-xl"><Car size={16} strokeWidth={1.5} /></div>
                                <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vehicle</p>
                                  <p className="text-xs font-black uppercase tracking-wide">{apt.vehicle_make_model || apt.vehicle_info || '—'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gray-50 rounded-xl"><Calendar size={16} strokeWidth={1.5} /></div>
                                <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                                  <p className="text-xs font-black uppercase tracking-wide">
                                    {new Date(apt.scheduled_time).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-20 text-center">
                        <ShieldCheck size={24} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No active appointments</p>
                        <button onClick={() => setView('booking')} className="mt-4 text-xs font-black uppercase tracking-widest" style={{ color: tc }}>
                          Book your first →
                        </button>
                      </div>
                    )}
                  </section>

                  {/* History */}
                  {myBookings.filter(b => b.status === 'Completed').length > 0 && (
                    <section>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic text-gray-400">service_history</h2>
                      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                        {myBookings.filter(b => b.status === 'Completed').map((apt, i, arr) => (
                          <div key={apt.id} className={`p-7 flex items-center justify-between hover:bg-gray-50 transition-all ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <div className="flex items-center gap-5">
                              <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center">
                                <CheckCircle2 size={18} strokeWidth={1.5} className="text-gray-300" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5 italic">
                                  {new Date(apt.scheduled_time).toLocaleDateString()}
                                </p>
                                <p className="text-base font-black italic tracking-tight">{apt.service_name || apt.service_type}</p>
                              </div>
                            </div>
                            <p className="font-black tracking-tighter text-lg">${apt.total_price}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                  <div className="bg-black text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <Zap className="absolute -right-6 -top-6 text-white/5" size={120} />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-gray-600 italic">member_profile</h3>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                          <User size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Account</p>
                          <p className="text-xs font-bold truncate">{customer?.email}</p>
                        </div>
                      </div>
                      <div className="text-center pt-5 border-t border-white/10">
                        <p className="text-3xl font-black tracking-tighter">{myBookings.length}</p>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Total Appointments</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 italic text-gray-400">Book Again</h3>
                    <button onClick={() => setView('booking')}
                      className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                      Schedule Service
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); setCustomer(null); }}
                      className="w-full mt-3 py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors flex items-center justify-center gap-2">
                      <LogOut size={11} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"><X size={15} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── Mobile Book Bar ── */}
      {view === 'landing' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 md:hidden z-40">
          <button onClick={() => setView('booking')}
            className="w-full py-4 text-white font-black text-xs uppercase tracking-widest rounded-full flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: tc }}>
            Book Now <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}