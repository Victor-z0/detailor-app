"use client";
import { useState } from 'react';
import {
  Zap, Play, Pause, Clock, Mail, MessageSquare,
  Star, RefreshCw, Gift, Flame, Users, ChevronRight,
  Plus, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle,
  Calendar, ArrowRight, Phone,
} from 'lucide-react';

type AutoStatus = 'active' | 'paused' | 'draft';

interface Automation {
  id:          string;
  name:        string;
  description: string;
  category:    string;
  icon:        any;
  iconBg:      string;
  iconColor:   string;
  status:      AutoStatus;
  triggered:   number;
  lastRun:     string;
  channel:     string[];
  steps:       string[];
  popular?:    boolean;
}

const AUTOMATIONS: Automation[] = [
  {
    id: '1',
    name: '4-Week Reactivation',
    description: 'Re-engage clients who haven\'t booked in 4 weeks with a personalized follow-up.',
    category: 'Reactivation',
    icon: RefreshCw,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    status: 'active',
    triggered: 34,
    lastRun: '2 hours ago',
    channel: ['SMS', 'Email'],
    steps: ['Wait 4 weeks after last job', 'Send personalized SMS', 'If no response, send email 3 days later', 'Final follow-up at 7 days'],
    popular: true,
  },
  {
    id: '2',
    name: '8-Week Reactivation',
    description: 'Stronger follow-up sequence for clients who haven\'t been in for 8+ weeks.',
    category: 'Reactivation',
    icon: RefreshCw,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    status: 'active',
    triggered: 18,
    lastRun: '1 day ago',
    channel: ['SMS', 'Email'],
    steps: ['Wait 8 weeks after last job', 'Send special offer SMS', 'Follow up with email if no response', 'Last chance offer at 14 days'],
  },
  {
    id: '3',
    name: 'Auto Google Review Request',
    description: 'Automatically ask satisfied clients to leave a Google review after job completion.',
    category: 'Reviews',
    icon: Star,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    status: 'active',
    triggered: 89,
    lastRun: '3 hours ago',
    channel: ['SMS'],
    steps: ['Job marked as complete', 'Wait 2 hours', 'Send review request SMS with Google link', 'Track click-through'],
    popular: true,
  },
  {
    id: '4',
    name: 'Holiday Marketing',
    description: 'Automated seasonal promotions — Christmas, New Year, Valentine\'s Day and more.',
    category: 'Marketing',
    icon: Gift,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    status: 'paused',
    triggered: 12,
    lastRun: '14 days ago',
    channel: ['SMS', 'Email'],
    steps: ['Trigger 7 days before holiday', 'Send promotional offer to all clients', 'Send reminder 2 days before', 'Follow up after holiday'],
  },
  {
    id: '5',
    name: 'Ceramic Coating Promo',
    description: 'Target clients who had basic details with a ceramic coating upgrade campaign.',
    category: 'Marketing',
    icon: Flame,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    status: 'paused',
    triggered: 7,
    lastRun: '5 days ago',
    channel: ['SMS', 'Email'],
    steps: ['Filter clients with 2+ basic details', 'Send ceramic coating education message', 'Follow up with limited-time discount', 'Send before/after photos'],
  },
  {
    id: '6',
    name: 'Lead Nurture Sequence',
    description: 'Automatically follow up with new leads who inquired but haven\'t booked yet.',
    category: 'Lead Nurture',
    icon: Users,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    status: 'draft',
    triggered: 0,
    lastRun: 'Never',
    channel: ['SMS', 'Email'],
    steps: ['New inquiry received', 'Immediate auto-reply with pricing', 'Day 2: Follow up with social proof', 'Day 5: Final offer with urgency'],
    popular: true,
  },
  {
    id: '7',
    name: 'Appointment Reminders',
    description: 'Send automatic reminders 24 hours and 2 hours before each booking.',
    category: 'Reminders',
    icon: Clock,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    status: 'active',
    triggered: 156,
    lastRun: '45 min ago',
    channel: ['SMS'],
    steps: ['Booking confirmed', '24 hours before: send reminder SMS', '2 hours before: send final reminder', 'Include address + prep instructions'],
    popular: true,
  },
  {
    id: '8',
    name: 'No-Show Follow Up',
    description: 'Automatically follow up with clients who missed their appointment.',
    category: 'Reminders',
    icon: AlertCircle,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    status: 'draft',
    triggered: 0,
    lastRun: 'Never',
    channel: ['SMS'],
    steps: ['Job marked as no-show', 'Wait 1 hour', 'Send friendly check-in SMS', 'Offer easy rebooking link'],
  },
];

const CATEGORIES = ['All', 'Reactivation', 'Reviews', 'Marketing', 'Lead Nurture', 'Reminders'];

function AutoCard({ auto, onToggle }: { auto: Automation; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = auto.icon;

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${auto.status === 'active' ? 'border-gray-100' : 'border-gray-100 opacity-80'}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${auto.iconBg}`}>
            <Icon size={20} className={auto.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">{auto.name}</h3>
              {auto.popular && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
              )}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                auto.status === 'active'  ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                auto.status === 'paused' ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                'text-gray-500 bg-gray-50 border border-gray-100'
              }`}>{auto.status}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{auto.description}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Zap size={10} /> {auto.triggered} triggered
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={10} /> {auto.lastRun}
              </span>
              <div className="flex gap-1">
                {auto.channel.map(c => (
                  <span key={c} className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{c}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
              <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            <button onClick={() => onToggle(auto.id)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                auto.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'
              }`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${auto.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Steps */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sequence Steps</p>
            <div className="space-y-2">
              {auto.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1.5">
              <ArrowRight size={12} /> Customize This Automation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const [autos,    setAutos]    = useState<Automation[]>(AUTOMATIONS);
  const [category, setCategory] = useState('All');

  const filtered = category === 'All' ? autos : autos.filter(a => a.category === category);

  const active  = autos.filter(a => a.status === 'active').length;
  const paused  = autos.filter(a => a.status === 'paused').length;
  const draft   = autos.filter(a => a.status === 'draft').length;
  const totalRun = autos.reduce((s, a) => s + a.triggered, 0);

  function toggleAuto(id: string) {
    setAutos(all => all.map(a => {
      if (a.id !== id) return a;
      return { ...a, status: a.status === 'active' ? 'paused' : 'active' };
    }));
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-400 mt-0.5">Set it and forget it — your business running on autopilot</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Plus size={15} /> New Automation
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active',       value: active.toString(),       color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Paused',       value: paused.toString(),       color: 'text-amber-600',   bg: 'bg-amber-50'   },
          { label: 'Drafts',       value: draft.toString(),        color: 'text-gray-500',    bg: 'bg-gray-100'   },
          { label: 'Total Triggered', value: totalRun.toString(), color: 'text-blue-600',    bg: 'bg-blue-50'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* AUTOMATIONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(auto => (
          <AutoCard key={auto.id} auto={auto} onToggle={toggleAuto} />
        ))}
      </div>

      {/* INFO BANNER */}
      <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">SMS & Email Sending Coming Soon</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Automations are being built out — toggle them on now so they activate automatically when SMS sending goes live. Clients will be messaged through your connected number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}