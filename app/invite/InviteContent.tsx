"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export default function InviteContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code) return;
    setLoading(true);
    
    const { data: invite, error: inviteErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .single();

    if (inviteErr || !invite) {
      alert("Invalid_Protocol: Invite code is expired or unrecognized.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('profiles').update({ role: invite.role }).eq('id', user.id);
      await supabase.from('invitations').update({ is_used: true }).eq('id', invite.id);
      router.push('/dashboard/staffs');
    } else {
      router.push(`/login?code=${code}`);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-black rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-2xl">
          <ShieldCheck size={36} />
        </div>
        <Zap className="absolute -top-2 -right-2 text-black fill-black animate-pulse" size={24} />
      </div>
      
      <div>
        <h1 className="text-5xl font-black italic tracking-tightest lowercase leading-none">join_studio.</h1>
        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-200 mt-4">Elevated_Access_Pending // Node: {code || 'N/A'}</p>
      </div>

      <button 
        onClick={handleJoin}
        disabled={loading || !code}
        className="w-full py-9 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-20 group"
      >
        {loading ? 'Authorizing_Node...' : 'Accept_Permissions'} 
        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}