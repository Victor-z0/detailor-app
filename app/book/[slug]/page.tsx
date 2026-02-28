"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function PublicBookingPage() {
  const { slug } = useParams();
  const [businessName, setBusinessName] = useState('Loading...');
  const [step, setStep] = useState(1); // 1: Vehicle, 2: Service, 3: Date/Contact
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    type: 'Sedan',
    service: 'Full Detail',
    date: ''
  });

  // Fetch the business name based on the URL slug
  useEffect(() => {
    async function getBusiness() {
      const { data } = await supabase.from('profiles').select('business_name').eq('business_name', slug).single();
      if (data) setBusinessName(data.business_name);
    }
    getBusiness();
  }, [slug]);

  const handleBook = async () => {
    setLoading(true);
    const { error } = await supabase.from('appointments').insert([{
      customer_name: formData.name,
      customer_phone: formData.phone,
      vehicle_make_model: formData.vehicle,
      vehicle_type: formData.type,
      service_name: formData.service,
      status: 'Upcoming',
      source: 'public_link',
      scheduled_time: formData.date
    }]);

    if (!error) setStep(4); // Success Step
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black">
            {businessName.charAt(0)}
          </div>
          <h1 className="text-2xl font-black tracking-tight">{businessName}</h1>
          <p className="text-gray-400 font-medium text-sm">Professional Detailing Booking</p>
        </div>

        {step < 4 && (
          <div className="flex justify-between mb-8 px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-[30%] rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-100'}`} />
            ))}
          </div>
        )}

        {/* STEP 1: VEHICLE */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">What are we cleaning?</h2>
            <input 
              placeholder="Vehicle (e.g. 2022 Honda Civic)" 
              className="w-full p-5 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-blue-600 font-medium"
              onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
              {['Sedan', 'SUV', 'Truck', 'Coupe'].map((t) => (
                <button 
                  key={t}
                  onClick={() => { setFormData({...formData, type: t}); setStep(2); }}
                  className="p-5 border-2 border-gray-100 rounded-2xl font-bold hover:border-blue-600 hover:bg-blue-50 transition-all text-sm"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: SERVICE */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold mb-4">Choose a Package</h2>
            {['Basic Wash', 'Full Detail', 'Paint Correction'].map((s) => (
              <button 
                key={s}
                onClick={() => { setFormData({...formData, service: s}); setStep(3); }}
                className="w-full p-6 border-2 border-gray-100 rounded-3xl text-left font-bold flex justify-between items-center hover:border-blue-600 group"
              >
                {s}
                <span className="text-blue-600 opacity-0 group-hover:opacity-100">→</span>
              </button>
            ))}
            <button onClick={() => setStep(1)} className="text-gray-400 font-bold text-sm w-full pt-4">← Back</button>
          </div>
        )}

        {/* STEP 3: CONTACT & DATE */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Final Details</h2>
            <input 
              placeholder="Your Name" 
              className="w-full p-5 bg-gray-50 rounded-2xl outline-none"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input 
              placeholder="Phone Number" 
              className="w-full p-5 bg-gray-50 rounded-2xl outline-none"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <input 
              type="datetime-local"
              className="w-full p-5 bg-gray-50 rounded-2xl outline-none"
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
            <button 
              disabled={loading}
              onClick={handleBook}
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all"
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="text-center py-10">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-black mb-2">Booking Sent!</h2>
            <p className="text-gray-500 font-medium">We'll reach out shortly to confirm your detail.</p>
            <button 
              onClick={() => setStep(1)}
              className="mt-8 text-blue-600 font-bold"
            >
              Book another vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}