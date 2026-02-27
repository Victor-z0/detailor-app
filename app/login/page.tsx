"use client";

import { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      // If login is successful, send them straight to the dashboard
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h2>
        <p className="mt-2 text-gray-600">Log in to manage your detailing shop</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-50 py-8 px-4 shadow rounded-xl border border-gray-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand outline-none transition-all"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand outline-none transition-all"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
  type="submit"
  disabled={loading}
  // Hardcoded blue + shadow for guaranteed visibility
  className="w-full py-3 px-4 rounded-md font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-all disabled:bg-gray-400 mt-4"
>
  {loading ? 'Logging in...' : 'Sign In'}
</button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}