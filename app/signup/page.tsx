"use client";

import { useState } from 'react';
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation'; // Import the router

export default function SignUpPage() {
  const router = useRouter(); // Initialize the router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This tells Supabase where to send the user after they click the email link
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      // Success! Move them to the next step
      router.push('/onboarding');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-50 py-8 px-4 shadow rounded-xl border border-gray-200 sm:px-10">
          <form className="space-y-6" onSubmit={handleSignUp}>
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
  // Hardcoded blue ensures visibility while we debug the CSS theme
  className="w-full py-3 px-4 rounded-md font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-lg transition-all disabled:bg-gray-400"
>
  {loading ? 'Creating...' : 'Sign Up'}
</button>
          </form>
          {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </div>
      </div>
    </div>
  );
}