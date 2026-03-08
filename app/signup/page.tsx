"use client";

import { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, Ticket, ArrowRight, ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. If an invite code is provided, verify it first
    let role = 'admin'; // Default for new shops
    if (inviteCode) {
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', inviteCode.toUpperCase())
        .eq('is_used', false)
        .single();

      if (inviteError || !invite) {
        alert("Invalid or expired invite code.");
        setLoading(false);
        return;
      }
      role = 'staff';
    }

    // 2. Proceed with Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role: role, // Pass role to metadata for the trigger to handle
        }
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      // 3. Mark invite as used if applicable
      if (inviteCode) {
        await supabase.from('invitations').update({ is_used: true }).eq('code', inviteCode.toUpperCase());
      }
      // Route to onboarding sequence
      router.push('/onboarding');
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* BRANDING */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter lowercase">detailor.</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Scale your detailing business</p>
        </div>

        <div className="space-y-8">
          {/* GOOGLE AUTH BUTTON */}
          <button 
            onClick={handleGoogleSignUp}
            className="group w-full flex items-center justify-center gap-3 p-4 border border-gray-100 rounded-[2rem] font-bold text-sm lowercase italic tracking-tight hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
            login / signup with google
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-gray-50"></div>
            <span className="absolute bg-white px-4 text-[8px] font-black uppercase tracking-widest text-gray-300">or_create_with_email</span>
          </div>

          {/* EMAIL FORM */}
          <form className="space-y-5" onSubmit={handleSignUp}>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="email"
                  placeholder="shop@example.com"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-bold tracking-tight focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-bold tracking-tight focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Invite Code (Staff Only)</label>
              <div className="relative">
                <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="text"
                  placeholder="Optional Code"
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-bold tracking-tight focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6}
              className="w-full py-5 bg-black text-white rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2 mt-8"
            >
              {loading ? 'creating_account...' : <><UserPlus size={14} /> get_started</>}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="text-center pt-4">
            <Link 
              href="/login" 
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2 group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> already_have_an_account? sign_in 
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}