"use client";
import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Mail, Instagram, Facebook, Search,
  Send, Phone, RefreshCw, X, Plus, ArrowLeft,
  MoreHorizontal, Star, Trash2, Zap, Settings,
  AlertCircle, ExternalLink, Copy, Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Platform config
// ─────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'all',       label: 'All',       icon: MessageSquare, color: 'text-gray-500',   bg: 'bg-gray-100',  dot: 'bg-gray-400',   accent: '#6b7280' },
  { id: 'sms',       label: 'SMS',       icon: Phone,         color: 'text-blue-600',   bg: 'bg-blue-50',   dot: 'bg-blue-500',   accent: '#2563eb' },
  { id: 'instagram', label: 'Instagram', icon: Instagram,     color: 'text-pink-600',   bg: 'bg-pink-50',   dot: 'bg-pink-500',   accent: '#ec4899' },
  { id: 'facebook',  label: 'Facebook',  icon: Facebook,      color: 'text-blue-700',   bg: 'bg-blue-100',  dot: 'bg-blue-700',   accent: '#1d4ed8' },
  { id: 'email',     label: 'Email',     icon: Mail,          color: 'text-violet-600', bg: 'bg-violet-50', dot: 'bg-violet-500', accent: '#7c3aed' },
];
const PM = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

const CHANNEL_STATUS: Record<string, { connected: boolean; hint: string; docsUrl: string; envVars: string[] }> = {
  sms: {
    connected: false,
    hint: 'Add TELNYX_API_KEY + TELNYX_FROM_NUMBER to Vercel env vars',
    docsUrl: 'https://developers.telnyx.com/docs/v2/messaging',
    envVars: ['TELNYX_API_KEY', 'TELNYX_FROM_NUMBER', 'TELNYX_MESSAGING_PROFILE_ID'],
  },
  instagram: {
    connected: false,
    hint: 'Add META_ACCESS_TOKEN + META_IG_USER_ID to Vercel env vars',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform/instagram',
    envVars: ['META_ACCESS_TOKEN', 'META_IG_USER_ID'],
  },
  facebook: {
    connected: false,
    hint: 'Add META_ACCESS_TOKEN + META_PAGE_ID to Vercel env vars',
    docsUrl: 'https://developers.facebook.com/docs/messenger-platform',
    envVars: ['META_ACCESS_TOKEN', 'META_PAGE_ID'],
  },
  email: {
    connected: false,
    hint: 'Add SMTP_HOST + SMTP_USER + SMTP_PASS to Vercel env vars',
    docsUrl: 'https://nodemailer.com/smtp/',
    envVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
  },
};

// ─────────────────────────────────────────────────────────
// Mock threads
// ─────────────────────────────────────────────────────────
const MOCK_THREADS = [
  { id:'1', platform:'sms',       name:'James Wilson',   handle:'+15552014567',   avatar:'J', unread:2, starred:false, lastMessage:'Can I reschedule for Saturday?',           lastTs: Date.now()-120000,    messages:[{id:'m1',from:'them',text:'Hi! I have a booking for Friday 10am.',ts:Date.now()-3600000},{id:'m2',from:'me',text:'Confirmed! See you then.',ts:Date.now()-3500000},{id:'m3',from:'them',text:'What do I need to do to prep?',ts:Date.now()-3400000},{id:'m4',from:'me',text:'Just park somewhere accessible — that\'s it!',ts:Date.now()-3300000},{id:'m5',from:'them',text:'Can I reschedule for Saturday?',ts:Date.now()-120000}] },
  { id:'2', platform:'instagram', name:'Maria Garcia',   handle:'@mariadetail',   avatar:'M', unread:1, starred:true,  lastMessage:'Your work on my Merc was 🔥🔥',              lastTs: Date.now()-900000,    messages:[{id:'m1',from:'them',text:'Hi! Saw your ceramic reel. Do you do Mercs?',ts:Date.now()-86400000},{id:'m2',from:'me',text:'Absolutely! Want to book a consult?',ts:Date.now()-86000000},{id:'m3',from:'them',text:'Yes! How long does full ceramic take?',ts:Date.now()-85000000},{id:'m4',from:'me',text:'Typically 6–8 hours.',ts:Date.now()-84000000},{id:'m5',from:'them',text:'Your work on my Merc was 🔥🔥',ts:Date.now()-900000}] },
  { id:'3', platform:'facebook',  name:'Ashley Chen',    handle:'ashley.chen.fb', avatar:'A', unread:3, starred:false, lastMessage:'What packages for SUVs?',                  lastTs: Date.now()-10800000,  messages:[{id:'m1',from:'them',text:'Hi! Found you through Facebook ads.',ts:Date.now()-14400000},{id:'m2',from:'me',text:'Welcome! Happy to help.',ts:Date.now()-14000000},{id:'m3',from:'them',text:'I have a Ford Explorer. What packages for SUVs?',ts:Date.now()-10800000}] },
  { id:'4', platform:'email',     name:'Tyler Brooks',   handle:'tyler@gmail.com',avatar:'T', unread:0, starred:false, lastMessage:'Invoice attached — any questions?',         lastTs: Date.now()-3600000,   messages:[{id:'m1',from:'them',text:'Got a quote for paint correction. Still valid?',ts:Date.now()-7200000},{id:'m2',from:'me',text:'Yes — 30 days! Ready to book?',ts:Date.now()-7000000},{id:'m3',from:'them',text:'Great — can you send the invoice?',ts:Date.now()-6800000},{id:'m4',from:'me',text:'Invoice attached — any questions?',ts:Date.now()-3600000}] },
  { id:'5', platform:'sms',       name:'Marcus Johnson', handle:'+15553902211',   avatar:'M', unread:0, starred:true,  lastMessage:'Perfect, see you Thursday! 👍',              lastTs: Date.now()-86400000,  messages:[{id:'m1',from:'them',text:'Any openings this week?',ts:Date.now()-172800000},{id:'m2',from:'me',text:'Thursday 9am is open — want it?',ts:Date.now()-172000000},{id:'m3',from:'them',text:'Perfect, see you Thursday! 👍',ts:Date.now()-86400000}] },
  { id:'6', platform:'instagram', name:'Kayla Simmons',  handle:'@kaylasimmons_', avatar:'K', unread:0, starred:false, lastMessage:'Can you do full detail + tints same day?', lastTs: Date.now()-172800000, messages:[{id:'m1',from:'them',text:'Can you do full detail + tints same day?',ts:Date.now()-172800000}] },
];

const QUICK_REPLIES = [
  'Thanks for reaching out! I\'ll get back to you shortly.',
  'Your appointment is confirmed ✅',
  'Fully booked this week — I have next week available.',
  'Can you share your availability?',
  'The price for that service starts at $',
  'Here\'s my booking link: ',
];

async function dispatchMessage(platform: string, handle: string, text: string) {
  try {
    const res = await fetch(`/api/messages/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: handle, text }),
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  } catch (err) {
    console.warn(`[${platform}] mock mode:`, err);
    return true;
  }
}

function fmtTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000)    return 'now';
  if (d < 3600000)  return `${Math.floor(d/60000)}m`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h`;
  return new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function Avatar({ name, size='md' }: { name:string; size?:'sm'|'md'|'lg' }) {
  const s = size==='sm' ? 'w-8 h-8 text-xs' : size==='lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  const colors = ['from-blue-500 to-blue-600','from-pink-500 to-rose-600','from-violet-500 to-purple-600','from-amber-500 to-orange-600','from-emerald-500 to-teal-600'];
  return (
    <div className={`${s} rounded-2xl bg-gradient-to-br ${colors[name.charCodeAt(0)%colors.length]} flex items-center justify-center text-white font-black flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function PlatformDot({ platform }: { platform:string }) {
  const p = PM[platform]||PM.sms; const Icon=p.icon;
  return <span className={`inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${p.bg} ${p.color}`}><Icon size={8}/> {p.label}</span>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
      {copied ? <><Check size={10} className="text-emerald-500"/> Copied!</> : <><Copy size={10}/> Copy</>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Settings / connection modal
// ─────────────────────────────────────────────────────────
function SettingsModal({ onClose }: { onClose: ()=>void }) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app';
  const webhookUrl  = `${appUrl}/api/messages/webhook`;
  const failoverUrl = `${appUrl}/api/messages/webhook/failover`;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-900 text-sm">Channel Setup</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={15}/></button>
        </div>
        <div className="p-5 space-y-4">

          {/* Webhook URLs — shown first since they apply to everything */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Your Webhook URLs</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">Paste these into Telnyx and Meta dashboards so incoming messages arrive in your inbox.</p>

            <div className="space-y-2">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary (Inbound + Outbound)</p>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <code className="text-[10px] text-gray-700 flex-1 truncate font-mono">{webhookUrl}</code>
                  <CopyButton text={webhookUrl}/>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Failover (Telnyx only)</p>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                  <code className="text-[10px] text-gray-700 flex-1 truncate font-mono">{failoverUrl}</code>
                  <CopyButton text={failoverUrl}/>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Telnyx retries this URL if the primary fails. It does the same thing — saving messages so nothing gets lost.</p>
              </div>
            </div>
          </div>

          {/* Per-channel cards */}
          {PLATFORMS.filter(p=>p.id!=='all').map(p => {
            const Icon = p.icon;
            const info = CHANNEL_STATUS[p.id];
            const WHERE: Record<string,string> = {
              sms:       'Telnyx → Messaging Profiles → your profile → Webhook URL',
              instagram: 'Meta App Dashboard → Webhooks → Callback URL',
              facebook:  'Meta App Dashboard → Webhooks → Callback URL',
              email:     'No webhook needed — SMTP sends/receives directly',
            };
            return (
              <div key={p.id} className={`p-4 rounded-2xl border ${p.bg} border-gray-100`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                      <Icon size={15} className={p.color}/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{p.label}</p>
                      <p className={`text-[10px] font-bold ${info?.connected ? 'text-emerald-600' : 'text-red-400'}`}>
                        {info?.connected ? '● Connected' : '● Not connected'}
                      </p>
                    </div>
                  </div>
                  <a href={info?.docsUrl||'#'} target="_blank"
                    className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline">
                    Docs <ExternalLink size={9}/>
                  </a>
                </div>

                {/* Env vars */}
                <div className="mb-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Vercel Env Vars</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info?.envVars.map(k => (
                      <code key={k} className="text-[10px] font-mono bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-600">{k}</code>
                    ))}
                  </div>
                </div>

                {/* Where to paste webhook */}
                {p.id !== 'email' && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-white">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paste webhook in</p>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{WHERE[p.id]}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <strong>After adding env vars:</strong> Go to Vercel → your project → Redeploy. Messages will then flow into your inbox in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [threads,        setThreads]        = useState(MOCK_THREADS);
  const [activePlatform, setActivePlatform] = useState('all');
  const [search,         setSearch]         = useState('');
  const [activeThread,   setActiveThread]   = useState<any|null>(null);
  const [reply,          setReply]          = useState('');
  const [sending,        setSending]        = useState(false);
  const [showQuick,      setShowQuick]      = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [newForm,        setNewForm]        = useState({ platform:'sms', to:'', message:'' });
  const [newSending,     setNewSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [activeThread?.id, activeThread?.messages?.length]);

  const filtered = threads
    .filter(t => activePlatform==='all' || t.platform===activePlatform)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.handle.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => b.lastTs - a.lastTs);

  const totalUnread = threads.reduce((s,t) => s+t.unread, 0);

  function selectThread(t: any) {
    setActiveThread(t);
    setThreads(ts => ts.map(x => x.id===t.id ? {...x, unread:0} : x));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
  }

  async function handleSend() {
    if (!reply.trim() || !activeThread) return;
    setSending(true);
    const msg = { id:`m${Date.now()}`, from:'me', text:reply.trim(), ts:Date.now() };
    await dispatchMessage(activeThread.platform, activeThread.handle, reply.trim());
    const updated = { ...activeThread, messages:[...activeThread.messages, msg], lastMessage:reply.trim(), lastTs:Date.now() };
    setThreads(ts => ts.map(x => x.id===activeThread.id ? updated : x));
    setActiveThread(updated);
    setReply('');
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 50);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleNewMessage() {
    if (!newForm.to.trim() || !newForm.message.trim()) return;
    setNewSending(true);
    await dispatchMessage(newForm.platform, newForm.to, newForm.message);
    const thread = {
      id: Date.now().toString(), platform: newForm.platform,
      name: newForm.to, handle: newForm.to,
      avatar: newForm.to.charAt(0).toUpperCase(),
      unread:0, starred:false, lastMessage: newForm.message, lastTs: Date.now(),
      messages: [{ id:`m${Date.now()}`, from:'me', text:newForm.message, ts:Date.now() }],
    };
    setThreads(ts => [thread, ...ts]);
    setActiveThread(thread);
    setNewSending(false); setShowNew(false);
    setNewForm({ platform:'sms', to:'', message:'' });
  }

  const activeP = activeThread ? (PM[activeThread.platform]||PM.sms) : null;

  // ── Layout:
  // Mobile:  thread list fills screen → tap → conversation fills screen (back button returns)
  // Desktop: side-by-side, thread list fixed width, conversation takes remaining space
  // Key fix: use fixed heights that account for top header (56px) + mobile bottom nav (60px)
  return (
    <>
      {/* Full-bleed layout — escape the dashboard padding */}
      <div className="fixed inset-0 top-14 lg:top-0 lg:relative lg:inset-auto flex lg:h-[calc(100vh-0px)] -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 overflow-hidden bg-gray-50"
        style={{ bottom: 0 }}>

        {/* ── THREAD LIST ── */}
        <div className={`
          flex flex-col bg-white border-r border-gray-100 flex-shrink-0 w-full sm:w-72 lg:w-80
          ${activeThread ? 'hidden sm:flex' : 'flex'}
        `}
          /* On mobile, leave space for the bottom nav (60px) */
          style={{ paddingBottom: activeThread ? 0 : 60 }}>

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-gray-900">Inbox</h2>
                {totalUnread>0 && <span className="text-[10px] font-black text-white bg-blue-600 px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowNew(true)} className="p-2 hover:bg-gray-100 rounded-xl"><Plus size={15} className="text-gray-500"/></button>
                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-xl"><Settings size={15} className="text-gray-500"/></button>
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
              {PLATFORMS.map(p => {
                const Icon=p.icon;
                const cnt = p.id==='all' ? totalUnread : threads.filter(t=>t.platform===p.id&&t.unread>0).reduce((s,t)=>s+t.unread,0);
                return (
                  <button key={p.id} onClick={()=>setActivePlatform(p.id)}
                    className={`relative flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${activePlatform===p.id ? `${p.bg} ${p.color}` : 'text-gray-400 hover:bg-gray-50'}`}>
                    <Icon size={11}/>
                    <span className="hidden xs:inline sm:inline">{p.label}</span>
                    {cnt>0 && <span className="w-3.5 h-3.5 text-[8px] font-black text-white bg-blue-500 rounded-full flex items-center justify-center">{cnt}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Threads */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filtered.length===0 && (
              <div className="py-12 text-center px-4">
                <MessageSquare size={24} className="text-gray-200 mx-auto mb-2"/>
                <p className="text-sm text-gray-400 font-semibold">No conversations yet</p>
                <button onClick={()=>setShowNew(true)} className="mt-2 text-xs text-blue-600 font-semibold hover:underline">Start one</button>
              </div>
            )}
            {filtered.map(t => {
              const p=PM[t.platform]||PM.sms; const Icon=p.icon;
              const isActive = activeThread?.id===t.id;
              return (
                <div key={t.id} onClick={()=>selectThread(t)}
                  className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 ${isActive ? 'bg-blue-50/60' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <Avatar name={t.name}/>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${p.bg} flex items-center justify-center border-2 border-white`}>
                      <Icon size={8} className={p.color}/>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-sm truncate ${t.unread>0 ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>{t.name}</p>
                      <span className="text-[10px] text-gray-300 flex-shrink-0">{fmtTime(t.lastTs)}</span>
                    </div>
                    <p className={`text-xs truncate ${t.unread>0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{t.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-1">
                    {t.unread>0 && <span className="w-5 h-5 text-[9px] font-black text-white bg-blue-600 rounded-full flex items-center justify-center">{t.unread}</span>}
                    {t.starred && <Star size={10} className="text-amber-400" fill="currentColor"/>}
                  </div>
                </div>
              );
            })}
            {/* Bottom padding so last item isn't hidden on mobile */}
            <div className="h-4"/>
          </div>
        </div>

        {/* ── CONVERSATION ── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${!activeThread ? 'hidden sm:flex' : 'flex'}`}>

          {/* Empty state */}
          {!activeThread && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-blue-600"/>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Unified Inbox</h3>
              <p className="text-sm text-gray-400 max-w-xs mb-5">SMS, Instagram, Facebook, and email — all in one place. Select a conversation to reply.</p>
              <button onClick={()=>setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                <Plus size={14}/> New Message
              </button>
            </div>
          )}

          {activeThread && activeP && (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
                {/* Back button — mobile only */}
                <button onClick={()=>setActiveThread(null)}
                  className="sm:hidden p-2 -ml-1 hover:bg-gray-100 rounded-xl flex-shrink-0">
                  <ArrowLeft size={16} className="text-gray-600"/>
                </button>
                <Avatar name={activeThread.name} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 truncate">{activeThread.name}</p>
                    <PlatformDot platform={activeThread.platform}/>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{activeThread.handle}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={()=>setThreads(ts=>ts.map(t=>t.id===activeThread.id?{...t,starred:!t.starred}:t))}
                    className="p-2 hover:bg-gray-100 rounded-xl">
                    <Star size={15} className={activeThread.starred?'text-amber-400 fill-current':'text-gray-300'}/>
                  </button>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-xl"><MoreHorizontal size={15} className="text-gray-400"/></button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 w-36 hidden group-hover:block">
                      <button onClick={()=>{setThreads(ts=>ts.filter(t=>t.id!==activeThread.id));setActiveThread(null);}}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">
                        <Trash2 size={11}/> Delete thread
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Not-connected banner */}
              {!CHANNEL_STATUS[activeThread.platform]?.connected && (
                <div className={`mx-3 mt-2 flex-shrink-0 px-4 py-3 rounded-xl flex items-start gap-2 ${(PM[activeThread.platform]||PM.sms).bg}`}>
                  <AlertCircle size={13} className={`${(PM[activeThread.platform]||PM.sms).color} flex-shrink-0 mt-0.5`}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-700 font-semibold">Not connected — replies won't send yet</p>
                    <button onClick={()=>setShowSettings(true)} className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5">Setup {(PM[activeThread.platform]||PM.sms).label} →</button>
                  </div>
                </div>
              )}

              {/* Messages scroll area */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-2"
                /* On mobile: leave room for reply box + bottom nav */
                style={{ paddingBottom: 8 }}>
                {activeThread.messages.map((msg: any, i: number) => {
                  const isMe = msg.from==='me';
                  const showTime = i===0 || (msg.ts - activeThread.messages[i-1].ts) > 300000;
                  return (
                    <div key={msg.id}>
                      {showTime && <p className="text-center text-[10px] text-gray-300 my-2 font-semibold">{fmtTime(msg.ts)}</p>}
                      <div className={`flex items-end gap-2 ${isMe?'justify-end':'justify-start'}`}>
                        {!isMe && <Avatar name={activeThread.name} size="sm"/>}
                        <div className={`max-w-[78%] sm:max-w-[65%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
                          style={isMe ? { backgroundColor: activeP.accent } : {}}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} className="h-1"/>
              </div>

              {/* Quick replies */}
              {showQuick && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {QUICK_REPLIES.map(q => (
                      <button key={q} onClick={()=>{setReply(q);setShowQuick(false);inputRef.current?.focus();}}
                        className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap max-w-[200px] truncate">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply box — sticks above mobile bottom nav */}
              <div className="flex-shrink-0 px-3 pt-2 pb-3 bg-white border-t border-gray-100"
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <button onClick={()=>setShowQuick(!showQuick)}
                    className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showQuick?'bg-blue-100 text-blue-600':'hover:bg-gray-100 text-gray-400'}`}>
                    <Zap size={15}/>
                  </button>
                  <textarea ref={inputRef}
                    value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={onKeyDown}
                    placeholder={`Reply via ${activeP.label}…`} rows={1}
                    className="flex-1 bg-transparent text-sm text-gray-800 resize-none focus:outline-none max-h-28 py-1.5 placeholder:text-gray-400"
                    style={{ minHeight:36 }}/>
                  <button onClick={handleSend} disabled={!reply.trim()||sending}
                    className={`p-2.5 rounded-xl flex-shrink-0 transition-all ${reply.trim()?'text-white shadow-sm':'text-gray-300 bg-gray-100'}`}
                    style={reply.trim()?{backgroundColor:activeP.accent}:{}}>
                    {sending ? <RefreshCw size={15} className="animate-spin"/> : <Send size={15}/>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── NEW MESSAGE MODAL ── */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-4" onClick={()=>setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">New Message</h3>
              <button onClick={()=>setShowNew(false)} className="p-1.5 hover:bg-gray-100 rounded-xl"><X size={15}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform</label>
                <div className="grid grid-cols-4 gap-2">
                  {PLATFORMS.filter(p=>p.id!=='all').map(p => {
                    const Icon=p.icon;
                    return (
                      <button key={p.id} onClick={()=>setNewForm(f=>({...f,platform:p.id}))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${newForm.platform===p.id ? `${p.bg} ${p.color} border-transparent` : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                        <Icon size={18}/> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {newForm.platform==='sms' ? 'Phone Number' : newForm.platform==='email' ? 'Email' : 'Handle / Username'}
                </label>
                <input value={newForm.to} onChange={e=>setNewForm(f=>({...f,to:e.target.value}))}
                  placeholder={newForm.platform==='sms'?'+1 555 000 0000':newForm.platform==='email'?'client@email.com':'@username'}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message</label>
                <textarea rows={3} value={newForm.message} onChange={e=>setNewForm(f=>({...f,message:e.target.value}))}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowNew(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button onClick={handleNewMessage} disabled={!newForm.to.trim()||!newForm.message.trim()||newSending}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {newSending?<RefreshCw size={13} className="animate-spin"/>:<Send size={13}/>}
                  {newSending?'Sending...':'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ── */}
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)}/>}
    </>
  );
}