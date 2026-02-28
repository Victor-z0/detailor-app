"use client";

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Car, CheckCircle2, RefreshCw, 
  AlertCircle, Zap, User, ArrowRight, ChevronLeft, Calendar,
  MapPin, ShieldCheck, Clock
} from 'lucide-react';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function PublicBookingPage({ params }: PageProps) {
  // Resolve params for Next.js 15+ compatibility
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [step, setStep] = useState(0); // 0 = Landing, 1 = Vehicle, 2 = Service, 3 = Finalize
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  
  const [vinInput, setVinInput] = useState('');
  const [vinLoading, setVinLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle: '',
    type: 'Sedan',
    service: null as any,
    date: ''
  });

  useEffect(() => {
    async function getBusinessAndServices() {
      if (!slug) return;
      const currentSlug = slug.replace(/-/g, ' ');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('business_name', currentSlug)
        .single();
      
      if (profile) {
        setBusiness(profile);
        const { data: svcs } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', profile.id)
          .order('price', { ascending: true });
        
        if (svcs) setServices(svcs);
      }
    }
    getBusinessAndServices();
  }, [slug]);

  const handleVinLookup = async () => {
    if (vinInput.length !== 17) return;
    setVinLoading(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vinInput}?format=json`);
      const data = await res.json();
      const getVal = (name: string) => data.Results.find((r: any) => r.Variable === name)?.Value;
      const make = getVal('Make'), model = getVal('Model'), year = getVal('Model Year');

      if (make && model) {
        setFormData({ ...formData, vehicle: `${year} ${make} ${model}` });
      }
    } catch (err) {
      console.error("VIN_DECODE_FAILURE");
    } finally {
      setVinLoading(false);
    }
  };

  const handleBookAndPay = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('appointments').insert([{
      user_id: business.id,
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_email: formData.email,
      vehicle_make_model: formData.vehicle,
      vehicle_type: formData.type,
      service_name: formData.service.name,
      status: 'Pending Payment',
      source: 'public_link',
      scheduled_time: formData.date,
      total_price: formData.service.price 
    }]).select().single();

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
      return;
    }

    setBooked(true);
    setTimeout(() => {
      const STRIPE_LINK = business.stripe_link || "https://buy.stripe.com/test_default";
      window.location.href = `${STRIPE_LINK}?client_reference_id=${data.id}&prefilled_email=${formData.email}`;
    }, 2500);
  };

  if (booked) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-700">
      <div className="w-32 h-32 bg-black rounded-[3.5rem] flex items-center justify-center text-white shadow-2xl mb-12 rotate-3">
        <CheckCircle2 size={48} strokeWidth={2.5} className="animate-bounce" />
      </div>
      <h2 className="text-5xl font-black italic tracking-tightest lowercase mb-4">session_logged.</h2>
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] leading-relaxed italic">
        securing_vault_access <br/> finalizing_payment_protocol
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white pb-32">
      
      {/* STEP 0: BUSINESS LANDING PAGE */}
      {step === 0 && business && (
        <div className="animate-in fade-in duration-1000">
          <div className="h-[45vh] w-full bg-gray-100 relative overflow-hidden">
            {business.banner_url ? (
              <img src={business.banner_url} className="w-full h-full object-cover grayscale opacity-60" alt="Banner" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>

          <main className="max-w-xl mx-auto px-8 -mt-24 relative z-10">
            <div className="bg-white p-2 rounded-[3.5rem] inline-block mb-8 shadow-2xl shadow-black/5">
              <div className="w-32 h-32 bg-black rounded-[3rem] flex items-center justify-center text-white text-4xl font-black italic overflow-hidden">
                {business.logo_url ? <img src={business.logo_url} className="w-full h-full object-cover" alt="Logo" /> : business.business_name?.charAt(0)}
              </div>
            </div>

            <h1 className="text-7xl font-black italic tracking-tightest lowercase leading-[0.8] mb-6">{business.business_name}.</h1>
            <p className="text-gray-400 font-bold text-sm mb-10 leading-relaxed max-w-sm italic">{business.bio || "Automotive protection and restoration studio."}</p>

            <div className="flex flex-wrap gap-6 mb-16 border-y border-gray-50 py-8">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <MapPin size={14} className="text-black"/> {business.location || "Base_Operations"}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <ShieldCheck size={14} className="text-black"/> Certified_Operator
              </div>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="w-full py-10 bg-black text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-[12px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              initialize_booking <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </main>
        </div>
      )}

      {/* STEPS 1-3: BOOKING FLOW */}
      {step > 0 && (
        <>
          <nav className="p-8 flex justify-between items-center max-w-4xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStep(0)}>
              <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white text-xs font-black italic shadow-xl group-hover:scale-110 transition-transform">
                {business?.business_name?.charAt(0) || 'S'}
              </div>
              <span className="font-black italic tracking-tighter lowercase text-xl">{business?.business_name}</span>
            </div>
            <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic">reservation_terminal_v2.6</div>
          </nav>

          <main className="max-w-xl mx-auto px-8">
            <div className="flex gap-3 mb-16">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-black' : 'bg-gray-50'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <header>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 italic">step_01</p>
                  <h2 className="text-6xl font-black italic tracking-tightest lowercase leading-none">unit_id.</h2>
                </header>

                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      placeholder="Enter_VIN_Code" 
                      maxLength={17}
                      className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black text-sm uppercase tracking-[0.2em] placeholder:text-gray-200 focus:bg-white focus:ring-2 focus:ring-black transition-all"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    />
                    <button 
                      onClick={handleVinLookup}
                      className="absolute right-4 top-4 bottom-4 px-8 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                    >
                      {vinLoading ? <RefreshCw className="animate-spin" size={16} /> : 'decode'}
                    </button>
                  </div>

                  <input 
                    placeholder="Year_Make_Model" 
                    value={formData.vehicle}
                    className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black italic text-lg focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {['Sedan', 'SUV', 'Truck', 'Performance'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => { setFormData({...formData, type: t}); setStep(2); }}
                      className={`p-10 rounded-[3rem] flex flex-col items-center gap-4 border transition-all ${formData.type === t ? 'bg-black text-white border-black shadow-2xl' : 'bg-white text-gray-400 border-gray-50 hover:border-black'}`}
                    >
                      <Car size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
                <header className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 italic">step_02</p>
                    <h2 className="text-6xl font-black italic tracking-tightest lowercase leading-none">protocol.</h2>
                  </div>
                  <button onClick={() => setStep(1)} className="p-4 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><ChevronLeft size={20}/></button>
                </header>

                <div className="space-y-4">
                  {services.map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => { setFormData({...formData, service: s}); setStep(3); }}
                      className="w-full p-10 bg-gray-50 rounded-[3.5rem] flex justify-between items-center group active:scale-[0.98] transition-all hover:bg-black hover:text-white"
                    >
                      <div className="text-left">
                        <p className="font-black italic text-2xl lowercase leading-none mb-2">{s.name}</p>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] group-hover:text-white/60">{s.duration || 'Estimated 180min'}</p>
                      </div>
                      <span className="font-black text-2xl italic tabular-nums">${s.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-12 duration-700">
                 <header className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mb-4 italic">step_03</p>
                    <h2 className="text-6xl font-black italic tracking-tightest lowercase leading-none">finalize.</h2>
                  </div>
                  <button onClick={() => setStep(2)} className="p-4 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all"><ChevronLeft size={20}/></button>
                </header>
                
                <div className="p-10 bg-black text-white rounded-[4rem] shadow-2xl space-y-8">
                    <div className="flex justify-between border-b border-white/10 pb-6">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Target_Unit</p>
                          <p className="text-xl font-black italic lowercase">{formData.vehicle}</p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Service_Tier</p>
                          <p className="text-xl font-black italic lowercase">{formData.service?.name}</p>
                       </div>
                    </div>
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">total_investment</p>
                       <p className="text-5xl font-black italic tabular-nums tracking-tightest leading-none">${formData.service?.price}</p>
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Legal_Name" 
                      className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black italic text-sm focus:bg-white focus:ring-2 focus:ring-black transition-all"
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <input 
                      placeholder="Comms_Number" 
                      className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black italic text-sm focus:bg-white focus:ring-2 focus:ring-black transition-all"
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <input 
                    placeholder="Digital_Receipt_Email" 
                    className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black italic text-sm focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  <div className="relative">
                    <input 
                      type="datetime-local"
                      className="w-full p-8 bg-gray-50 rounded-[2.5rem] outline-none font-black text-sm uppercase tracking-widest appearance-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                    <Calendar size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                </div>

                <button 
                  disabled={loading || !formData.name || !formData.email || !formData.date}
                  onClick={handleBookAndPay}
                  className="w-full py-10 bg-black text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-[12px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : <>Authorize_Session <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform"/></>}
                </button>
              </div>
            )}
          </main> 
        </>
      )}
    </div>
  );
}