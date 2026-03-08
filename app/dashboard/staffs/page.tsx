"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Mail, Shield, Trash2, Briefcase, User, Copy, CheckCheck } from 'lucide-react';

const ROLES = ['staff', 'manager', 'admin'] as const;
type Role = typeof ROLES[number];

const ROLE_STYLE: Record<Role, string> = {
  admin:   'bg-violet-50 text-violet-600 border border-violet-100',
  manager: 'bg-blue-50   text-blue-600   border border-blue-100',
  staff:   'bg-gray-50   text-gray-600   border border-gray-200',
};

export default function StaffsPage() {
  const [team, setTeam]           = useState<any[]>([]);
  const [invites, setInvites]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uid, setUid]             = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ email: '', role: 'staff' as Role });
  const [saving, setSaving]       = useState(false);
  const [copied, setCopied]       = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUid(user.id);
      Promise.all([
        supabase.from('profiles').select('*').eq('created_by', user.id),
        supabase.from('invitations').select('*').eq('created_by', user.id).eq('is_used', false).order('created_at', { ascending: false }),
      ]).then(([{ data: t }, { data: i }]) => {
        setTeam(t || []);
        setInvites(i || []);
        setLoading(false);
      });
    });
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    const code    = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expires = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const { data } = await supabase.from('invitations').insert([{
      created_by: uid, code, role: form.role, email: form.email, is_used: false, expires_at: expires,
    }]).select().single();
    if (data) setInvites(i => [data, ...i]);
    setSaving(false);
    setShowModal(false);
    setForm({ email: '', role: 'staff' });
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this invitation?')) return;
    await supabase.from('invitations').delete().eq('id', id);
    setInvites(i => i.filter(x => x.id !== id));
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-sm text-gray-400 mt-0.5">{team.length} team members · {invites.length} pending</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
          <Plus size={15} /> Invite Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
          <span className="text-xs text-gray-400">{team.length} total</span>
        </div>
        {team.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase size={18} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No team members yet</p>
            <p className="text-xs text-gray-300 mt-1">Send an invite to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {team.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(m.business_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.business_name || 'Team Member'}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${ROLE_STYLE[m.role as Role] ?? ROLE_STYLE.staff}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{inv.email || 'Invite link'}</p>
                  <p className="text-xs text-gray-400">
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}Code: <span className="font-mono">{inv.code}</span>
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${ROLE_STYLE[inv.role as Role] ?? ROLE_STYLE.staff}`}>
                  {inv.role}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => copyLink(inv.code)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {copied === inv.code ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                  <button onClick={() => revoke(inv.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { role: 'admin'   as Role, Icon: Shield,    desc: 'Full access to all features, settings, and team management.' },
            { role: 'manager' as Role, Icon: Briefcase, desc: 'Manage appointments, customers, and view analytics.' },
            { role: 'staff'   as Role, Icon: User,      desc: 'View and update their own assigned appointments.' },
          ].map(r => (
            <div key={r.role} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <r.Icon size={13} className="text-gray-400" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_STYLE[r.role]}`}>{r.role}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Invite Team Member</h3>
                <p className="text-xs text-gray-400 mt-0.5">They'll receive a one-time invite link</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={15} className="text-gray-400" /></button>
            </div>
            <form onSubmit={invite} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="team@example.com" className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                  {saving ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}