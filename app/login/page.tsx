"use client";

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Auto-fill the email if they checked "Remember Me" previously
  useEffect(() => {
    const savedEmail = localStorage.getItem('detailor_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 2. Save or remove the email from local storage based on the checkbox
    if (rememberMe) {
      localStorage.setItem('detailor_email', email);
    } else {
      localStorage.removeItem('detailor_email');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    // 3. OAuth inherently handles BOTH Sign Up and Log In automatically
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* BRANDING */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black italic tracking-tighter lowercase">detailor.</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Welcome Back to the Shop</p>
        </div>

        <div className="space-y-8">
          {/* GOOGLE AUTH BUTTON */}
          <button 
            onClick={handleGoogleLogin}
            className="group w-full flex items-center justify-center gap-3 p-4 border border-gray-100 rounded-[2rem] font-bold text-sm lowercase italic tracking-tight hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
            login / signup with google
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-gray-50"></div>
            <span className="absolute bg-white px-4 text-[8px] font-black uppercase tracking-widest text-gray-300">or_use_email</span>
          </div>

          {/* EMAIL FORM */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input
                  type="email"
                  value={email}
                  placeholder="name@business.com"
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
                  value={password}
                  placeholder="••••••••"
                  required
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-bold tracking-tight focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-200"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="flex items-center gap-3 px-4 pt-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-black rounded cursor-pointer"
              />
              <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none">
                Remember Email
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-black text-white rounded-[2.5rem] font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2 mt-8"
            >
              {loading ? 'authenticating...' : <><LogIn size={14} /> sign_in</>}
            </button>
          </form>

          {/* FOOTER LINKS */}
          <div className="text-center pt-4">
            <Link 
              href="/signup" 
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2 group"
            >
              no_account? create_one <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}