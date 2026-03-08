"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Zap, Star, Crown, ArrowRight, TrendingUp, Lock } from 'lucide-react';

// ── Plan level map (higher = more access) ─────────────────────────────
const PLAN_LEVEL: Record<string, number> = { essential: 1, choice: 2, exclusive: 3 };

// ── Your test account email — bypasses all locks ─────────────────────
const TEST_EMAIL = 'your@testemail.com'; // ← change this to your actual email

const PLANS = [
  {
    id: 'essential', name: 'Essential', Icon: Zap,
    price: 19, original: 59, cta: 'Start Essential',
    desc: 'For detailers just starting out',
    iconBg: 'bg-gray-100', iconColor: 'text-gray-500',
    features: ['Unlimited Jobs','Appointment Management','Basic Booking Page','Team Management','Basic Analytics','Built-in Payments'],
  },
  {
    id: 'choice', name: 'Choice', Icon: Star,
    price: 99, original: 149, cta: 'Go Choice', popular: true,
    desc: 'For established detailing businesses',
    iconBg: 'bg-white/20', iconColor: 'text-white',
    features: ['Everything in Essential','Customer Profiles & History','Custom Service Menu','In-app Messaging','Lookbook / Gallery','Detailed Analytics','Online Estimate Requests'],
  },
  {
    id: 'exclusive', name: 'Exclusive', Icon: Crown,
    price: 199, original: 249, cta: 'Go Exclusive',
    desc: 'For detailers scaling their business',
    iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
    features: ['Everything in Choice','Customizable Booking Page','Advanced Analytics','Revenue Forecasting','SMS Marketing Campaigns','Custom Booking URL'],
  },
];

type FeatureRow = {
  name: string;
  minPlan: 'essential' | 'choice' | 'exclusive';
  soon?: boolean;
};

const FEATURES: FeatureRow[] = [
  { name: 'Unlimited Jobs',             minPlan: 'essential' },
  { name: 'Appointment Management',     minPlan: 'essential' },
  { name: 'Team Management',            minPlan: 'essential' },
  { name: 'Built-in Payments',          minPlan: 'essential' },
  { name: 'Basic Booking Page',         minPlan: 'essential' },
  { name: 'Basic Analytics',            minPlan: 'essential' },
  { name: 'Customer Profiles',          minPlan: 'choice'    },
  { name: 'Custom Service Menu',        minPlan: 'choice'    },
  { name: 'In-app Messaging',           minPlan: 'choice'    },
  { name: 'Gallery / Lookbook',         minPlan: 'choice'    },
  { name: 'Detailed Analytics',         minPlan: 'choice'    },
  { name: 'Online Estimates',           minPlan: 'choice'    },
  { name: 'Customizable Booking Page',  minPlan: 'exclusive' },
  { name: 'Revenue Forecasting',        minPlan: 'exclusive' },
  { name: 'Advanced Analytics',         minPlan: 'exclusive' },
  { name: 'SMS Marketing',              minPlan: 'exclusive', soon: true },
  { name: 'Custom Booking URL',         minPlan: 'exclusive', soon: true },
];

function CellValue({ feature, planId, userPlan, isTest }: {
  feature: FeatureRow; planId: string; userPlan: string; isTest: boolean;
}) {
  const planHasIt = PLAN_LEVEL[planId] >= PLAN_LEVEL[feature.minPlan];
  if (!planHasIt) return <span className="block text-center text-gray-200">—</span>;
  if (feature.soon) return <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Soon</span>;
  return <Check size={15} className="text-emerald-500 mx-auto" />;
}

export default function PricingPage() {
  const [plan, setPlan]     = useState('essential');
  const [uid, setUid]       = useState<string | null>(null);
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState('');
  const [jv, setJv]         = useState(150);
  const [ej, setEj]         = useState(2);
  const [ah, setAh]         = useState(5);
  const [hr, setHr]         = useState(25);

  const isTest = email.toLowerCase() === TEST_EMAIL.toLowerCase();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUid(user.id);
      setEmail(user.email || '');
      supabase.from('profiles').select('plan').eq('id', user.id).single()
        .then(({ data }) => { if (data?.plan) setPlan(data.plan); });
    });
  }, []);

  async function upgrade(p: string) {
    if (!uid || p === plan) return;
    setBusy(p);
    await supabase.from('profiles').update({ plan: p }).eq('id', uid);
    setPlan(p);
    setBusy('');
  }

  const roi     = ej * jv + ah * 4 * hr - 199;
  const roiPct  = Math.round((roi / 199) * 100);
  const effectivePlan = isTest ? 'exclusive' : plan;

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-14">

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">One extra detail a month covers everything. No hidden fees.</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-sm font-semibold text-emerald-600">
            <Check size={13} /> Current plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </span>
          {isTest && (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-violet-50 border border-violet-100 rounded-full text-sm font-semibold text-violet-600">
              🧪 Test account — full access enabled
            </span>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5 items-center">
        {PLANS.map(p => {
          const active = plan === p.id;
          const pop    = p.popular ?? false;
          return (
            <div key={p.id} className={`relative rounded-2xl border-2 p-7 flex flex-col ${pop ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-400/25 scale-[1.02]' : active ? 'border-blue-300 bg-blue-50/30' : 'bg-white border-gray-100 shadow-sm'}`}>
              {pop  && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase">Most Popular</div>}
              {active && !pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">Current Plan</div>}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${pop ? 'bg-white/20' : p.iconBg}`}>
                <p.Icon size={18} className={pop ? 'text-white' : p.iconColor} />
              </div>
              <h3 className={`font-bold text-base ${pop ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
              <p className={`text-xs mt-0.5 mb-5 ${pop ? 'text-blue-200' : 'text-gray-400'}`}>{p.desc}</p>
              <div className="flex items-end gap-2 mb-6">
                <span className={`text-4xl font-black ${pop ? 'text-white' : 'text-gray-900'}`}>${p.price}</span>
                <div className="pb-1">
                  <span className={`text-sm line-through ${pop ? 'text-blue-300' : 'text-gray-300'}`}>${p.original}</span>
                  <span className={`text-xs ml-1 ${pop ? 'text-blue-200' : 'text-gray-400'}`}>/mo</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={13} className={`flex-shrink-0 mt-0.5 ${pop ? 'text-blue-200' : 'text-emerald-500'}`} />
                    <span className={pop ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => upgrade(p.id)} disabled={active || busy === p.id}
                className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${active ? (pop ? 'bg-white/20 text-white/70 cursor-default' : 'bg-gray-100 text-gray-400 cursor-default') : pop ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {busy === p.id ? 'Processing...' : active ? 'Current Plan' : p.cta}
                {!active && busy !== p.id && <ArrowRight size={14} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature access overview for current user */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your Feature Access</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isTest ? 'Test account — viewing all features' : `Based on your ${plan} plan`}
            </p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(feature => {
            const hasAccess = isTest || PLAN_LEVEL[effectivePlan] >= PLAN_LEVEL[feature.minPlan];
            const neededPlan = feature.minPlan;
            return (
              <div key={feature.name} className={`flex items-center gap-3 p-3 rounded-xl border ${hasAccess ? 'bg-gray-50 border-gray-100' : 'bg-red-50/30 border-red-100/60'}`}>
                {hasAccess
                  ? <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check size={12} className="text-emerald-600" /></div>
                  : <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><Lock size={12} className="text-red-400" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${hasAccess ? 'text-gray-800' : 'text-gray-400'}`}>{feature.name}</p>
                  {!hasAccess && (
                    <p className="text-[10px] text-red-400 mt-0.5">Requires {neededPlan} plan</p>
                  )}
                  {feature.soon && hasAccess && <p className="text-[10px] text-amber-500 mt-0.5">Coming soon</p>}
                </div>
              </div>
            );
          })}
        </div>
        {!isTest && PLAN_LEVEL[plan] < 3 && (
          <div className="px-6 pb-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Unlock more features</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {PLAN_LEVEL[plan] === 1
                    ? 'Upgrade to Choice to unlock Customers, Messages, Gallery & more'
                    : 'Upgrade to Exclusive to unlock advanced analytics, forecasting & SMS'}
                </p>
              </div>
              <button onClick={() => upgrade(PLAN_LEVEL[plan] === 1 ? 'choice' : 'exclusive')}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors flex-shrink-0 ml-4">
                Upgrade <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ROI Calculator */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">ROI Calculator</h2>
          <p className="text-sm text-gray-400 mt-0.5">See how quickly Detailor pays for itself</p>
        </div>
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <div className="p-7 space-y-6">
            {[
              { l: 'Average job value',       v: jv, s: setJv, min: 50,  max: 1000, step: 10, f: (n: number) => `$${n}`     },
              { l: 'Extra jobs / month',       v: ej, s: setEj, min: 1,   max: 20,   step: 1,  f: (n: number) => `${n} jobs` },
              { l: 'Admin hours saved / week', v: ah, s: setAh, min: 1,   max: 40,   step: 1,  f: (n: number) => `${n} hrs` },
              { l: 'Your hourly rate',         v: hr, s: setHr, min: 10,  max: 200,  step: 5,  f: (n: number) => `$${n}/hr` },
            ].map(r => (
              <div key={r.l}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">{r.l}</label>
                  <span className="text-sm font-bold text-gray-900">{r.f(r.v)}</span>
                </div>
                <input type="range" min={r.min} max={r.max} step={r.step} value={r.v}
                  onChange={e => r.s(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600" />
              </div>
            ))}
          </div>
          <div className="p-7 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <TrendingUp size={28} className="text-blue-300 mb-3" />
            <p className="text-blue-200 text-sm mb-1">Monthly ROI</p>
            <p className="text-5xl font-black">${roi.toLocaleString()}</p>
            <p className="text-blue-200 text-sm mb-6">{roiPct}% return</p>
            <div className="w-full bg-white/10 rounded-xl p-4 text-center mb-5">
              <p className="text-blue-200 text-xs mb-1">Annual ROI</p>
              <p className="text-3xl font-black">${(roi * 12).toLocaleString()}</p>
            </div>
            <ul className="text-xs text-blue-200 space-y-1 w-full">
              <li>• Extra revenue: {ej} × ${jv} = ${ej * jv}/mo</li>
              <li>• Time saved: {ah}h × ${hr} × 4wk = ${ah * 4 * hr}/mo</li>
              <li>• Plan cost: −$199/mo</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Full feature comparison table */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">Full Feature Comparison</h2>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50">
            <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Feature</div>
            {PLANS.map(p => (
              <div key={p.id} className={`p-4 text-center ${p.popular ? 'bg-blue-600' : ''}`}>
                <p className={`text-sm font-bold ${p.popular ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                <p className={`text-xs mt-0.5 ${p.popular ? 'text-blue-200' : 'text-gray-400'}`}>${p.price}/mo</p>
                {plan === p.id && <span className="inline-block mt-1 text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>}
              </div>
            ))}
          </div>
          {FEATURES.map((feature, i) => (
            <div key={feature.name} className={`grid grid-cols-4 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
              <div className="p-3.5 text-sm text-gray-700 flex items-center gap-2">
                {feature.name}
                {feature.soon && <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">Soon</span>}
              </div>
              {PLANS.map(p => (
                <div key={p.id} className={`p-3.5 flex items-center justify-center ${p.popular ? 'bg-blue-50/30' : ''}`}>
                  <CellValue feature={feature} planId={p.id} userPlan={plan} isTest={isTest} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      {!isTest && plan !== 'exclusive' && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">For the price of one detail</h2>
          <p className="text-blue-200 text-sm max-w-md mx-auto mb-6">The Exclusive plan is $199/mo — the same as one full detail. Book 2 extra jobs and you've already covered it.</p>
          <button onClick={() => upgrade('exclusive')} className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
            Upgrade to Exclusive <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}