"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Get the current logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Session expired. Please sign in again.");
      router.push('/signup');
      return;
    }

    // 2. Insert into the profiles table
    const slug = businessName.toLowerCase().trim().replace(/\s+/g, '-');
    
    const { error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: user.id, 
          business_name: businessName, 
          slug: slug 
        }
      ]);

    if (!error) {
      // 3. Success! Send them to the dashboard
      router.push('/dashboard'); 
    } else {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 text-black">
      <div className="max-w-md w-full mx-auto">
        <h2 className="text-3xl font-bold mb-2">Almost there!</h2>
        <p className="text-gray-500 mb-8">What is the name of your detailing business?</p>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand outline-none text-black"
              placeholder="e.g. Pro Shine Detailing"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:bg-gray-400 transition-all"
          >
            {loading ? 'Creating Shop...' : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}