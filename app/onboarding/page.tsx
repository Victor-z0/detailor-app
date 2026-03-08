"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Store } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Session expired. Please sign in again.");
      router.push('/login');
      return;
    }

    // 2. Generate slug and metadata
    const slug = businessName.toLowerCase().trim().replace(/\s+/g, '-');
    
    // 3. Upsert profile (Update if exists, insert if not)
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        business_name: businessName, 
        slug: slug,
        role: user.user_metadata?.role || 'admin', // Respect invite code role if present
        onboarded: true
      });

    if (!error) {
      router.push('/dashboard'); 
    } else {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-md space-y-12 text-center">
        
        {/* ICON & HEADER */}
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Sparkles className="text-black" size={28} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter lowercase">the_final_step</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Configure Your Detailing Shop</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-8">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Shop Name</label>
            <div className="relative">
              <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. midnight detail"
                className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[2.5rem] text-lg font-bold tracking-tight focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-200"
              />
            </div>
            <p className="text-[9px] text-gray-300 italic ml-4 mt-2">
              Your booking link will be: detailor.app/{businessName.toLowerCase().trim().replace(/\s+/g, '-') || 'your-shop'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !businessName}
            className="group w-full py-5 bg-black text-white rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-300 flex items-center justify-center gap-2"
          >
            {loading ? 'initializing_shop...' : (
              <>launch_dashboard <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}