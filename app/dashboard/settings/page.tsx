"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/settingsContext';
import {
  Save, Upload, Globe, Instagram, Facebook,
  Phone, MapPin, Clock, Palette, Link2,
  CheckCircle2, AlertCircle, Eye, Copy, RefreshCw,
  Building2, Image, Zap, Languages, Coins, CreditCard,
  ExternalLink, Camera, Crown
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${h12}:${m} ${ampm}` };
});

const THEME_COLORS = [
  { label: 'Blue',    value: '#2563eb' },
  { label: 'Violet',  value: '#7c3aed' },
  { label: 'Rose',    value: '#e11d48' },
  { label: 'Orange',  value: '#ea580c' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Cyan',    value: '#0891b2' },
  { label: 'Black',   value: '#111111' },
  { label: 'Slate',   value: '#475569' },
];

type DaySchedule = { enabled: boolean; start: string; end: string };
type AvailabilityMap = Record<string, DaySchedule>;

const DEFAULT_AVAIL: AvailabilityMap = Object.fromEntries(
  DAYS.map(d => [d, {
    enabled: !['Saturday', 'Sunday'].includes(d),
    start: '09:00',
    end: '17:00',
  }])
);

function parseAvailability(raw: any): AvailabilityMap {
  if (!raw) return DEFAULT_AVAIL;
  // Handle old string format: "9:00 AM - 5:00 PM" or "Closed"
  if (typeof Object.values(raw)[0] === 'string') {
    return Object.fromEntries(
      DAYS.map(d => {
        const val = raw[d] || 'Closed';
        if (val === 'Closed') return [d, { enabled: false, start: '09:00', end: '17:00' }];
        return [d, { enabled: true, start: '09:00', end: '17:00' }];
      })
    );
  }
  return { ...DEFAULT_AVAIL, ...raw };
}

export default function SettingsPage() {
  const { reload } = useSettings();
  const [user, setUser]                   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [error, setError]                 = useState('');
  const [activeSection, setActiveSection] = useState('business');
  const [uploadingCover, setUploadingCover]   = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [availability, setAvailability]   = useState<AvailabilityMap>(DEFAULT_AVAIL);

  const coverInputRef  = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name:    '',
    bio:              '',
    phone:            '',
    location:         '',
    website:          '',
    instagram:        '',
    facebook:         '',
    theme_color:      '#2563eb',
    stripe_link:      '',
    cover_url:        '',
    avatar_url:       '',
    slug:             '',
    currency_symbol:  '$',
    language:         'en',
    booking_notice:   '24',
    max_advance_days: '60',
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setForm({
          business_name:    p.business_name    || '',
          bio:              p.bio              || '',
          phone:            p.phone            || '',
          location:         p.location         || '',
          website:          p.website          || '',
          instagram:        p.instagram        || '',
          facebook:         p.facebook         || '',
          theme_color:      p.theme_color      || '#2563eb',
          stripe_link:      p.stripe_link      || '',
          cover_url:        p.cover_url        || p.banner_url || '',
          avatar_url:       p.avatar_url       || p.logo_url   || '',
          slug:             p.slug             || '',
          currency_symbol:  p.currency_symbol  || '$',
          language:         p.language         || 'en',
          booking_notice:   p.booking_notice   || '24',
          max_advance_days: p.max_advance_days || '60',
        });
        setAvailability(parseAvailability(p.availability_json));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function uploadImage(file: File, path: string) {
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(path);
    return publicUrl;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const url = await uploadImage(file, `${user.id}/cover.${ext}`);
      setForm(f => ({ ...f, cover_url: url }));
    } catch {
      setError('Cover upload failed. Make sure "business-assets" bucket exists in Supabase Storage.');
    }
    setUploadingCover(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const url = await uploadImage(file, `${user.id}/avatar.${ext}`);
      setForm(f => ({ ...f, avatar_url: url }));
    } catch {
      setError('Logo upload failed. Make sure "business-assets" bucket exists in Supabase Storage.');
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    const slug = form.slug ||
      form.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('profiles').upsert({
      id:               user.id,
      business_name:    form.business_name,
      slug,
      bio:              form.bio,
      phone:            form.phone,
      location:         form.location,
      website:          form.website,
      instagram:        form.instagram,
      facebook:         form.facebook,
      theme_color:      form.theme_color,
      primary_color:    form.theme_color,
      stripe_link:      form.stripe_link,
      cover_url:        form.cover_url,
      banner_url:       form.cover_url,
      avatar_url:       form.avatar_url,
      logo_url:         form.avatar_url,
      availability_json: availability,
      currency_symbol:  form.currency_symbol,
      language:         form.language,
      booking_notice:   form.booking_notice,
      max_advance_days: form.max_advance_days,
    });
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); reload(); }
    setSaving(false);
  }

  function copyBookingLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/${form.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleDay(day: string) {
    setAvailability(a => ({ ...a, [day]: { ...a[day], enabled: !a[day].enabled } }));
  }
  function setDayTime(day: string, field: 'start' | 'end', value: string) {
    setAvailability(a => ({ ...a, [day]: { ...a[day], [field]: value } }));
  }

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${form.slug}`
    : `/${form.slug}`;

  const sections = [
    { id: 'business',    label: 'Business Info',        icon: Building2  },
    { id: 'appearance',  label: 'Appearance',           icon: Palette    },
    { id: 'regional',    label: 'Regional & Language',  icon: Languages  },
    { id: 'contact',     label: 'Contact & Socials',    icon: Globe      },
    { id: 'hours',       label: 'Availability',         icon: Clock      },
    { id: 'booking',     label: 'Booking Settings',     icon: Link2      },
    { id: 'payments',    label: 'Payments',             icon: CreditCard },
    { id: 'plan',        label: 'Plan & Billing',       icon: Crown      },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-16">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Customize your public booking page</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle2 size={15} /> Saved!
            </span>
          )}
          <a href={bookingUrl} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-colors border border-gray-100">
            <Eye size={14} /> Preview
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            style={{ backgroundColor: form.theme_color }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-6">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div className="flex gap-6">

        {/* SIDEBAR */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1 sticky top-20">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${activeSection === s.id ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                style={activeSection === s.id ? { backgroundColor: form.theme_color } : {}}>
                <s.icon size={15} />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* BUSINESS INFO */}
          {activeSection === 'business' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Business Info</h2>
                <p className="text-xs text-gray-400 mt-0.5">Shown on your public booking page</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</label>
                    <input value={form.business_name}
                      onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                      placeholder="e.g. Elite Detail Studio"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking URL Slug</label>
                    <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                      <span className="text-xs text-gray-400 flex-shrink-0">yourapp.com/</span>
                      <input value={form.slug}
                        onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        className="flex-1 text-sm font-semibold text-gray-900 bg-transparent focus:outline-none min-w-0" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">About / Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell clients what makes your business special..."
                    rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <p className="text-xs text-gray-300">{form.bio.length} / 300 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">

              {/* Cover */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Cover Photo</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Hero banner on your booking page — 1200×400px recommended</p>
                </div>
                <div className="p-6">
                  <div className="relative h-44 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
                    onClick={() => coverInputRef.current?.click()}>
                    {form.cover_url ? (
                      <>
                        <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-semibold flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl">
                            <Upload size={14} /> Change Cover
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        {uploadingCover
                          ? <RefreshCw size={20} className="text-gray-300 animate-spin" />
                          : <><Camera size={24} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400 font-medium">Click to upload cover photo</p><p className="text-xs text-gray-300 mt-1">JPG or PNG, max 5MB</p></>}
                      </div>
                    )}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>

              {/* Avatar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Logo / Avatar</h2>
                  <p className="text-xs text-gray-400 mt-0.5">400×400px recommended</p>
                </div>
                <div className="p-6 flex items-center gap-5">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-black text-white cursor-pointer group"
                    style={{ backgroundColor: form.theme_color }}
                    onClick={() => avatarInputRef.current?.click()}>
                    {form.avatar_url
                      ? <img src={form.avatar_url} className="w-full h-full object-cover" alt="" />
                      : form.business_name?.charAt(0).toUpperCase() || '?'}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <button onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-colors border border-gray-100">
                      {uploadingAvatar ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-400 mt-2">PNG or JPG · Max 5MB</p>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
              </div>

              {/* Theme color */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Theme Color</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Used for buttons and accents on your booking page</p>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-3 mb-5">
                    {THEME_COLORS.map(c => (
                      <button key={c.value} onClick={() => setForm(f => ({ ...f, theme_color: c.value }))}
                        title={c.label}
                        className="w-10 h-10 rounded-xl transition-all hover:scale-110 relative shadow-sm"
                        style={{ backgroundColor: c.value }}>
                        {form.theme_color === c.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-500">Custom:</label>
                    <input type="color" value={form.theme_color}
                      onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-100" />
                    <span className="text-sm font-mono text-gray-400">{form.theme_color}</span>
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: form.theme_color }}>
                      Preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGIONAL */}
          {activeSection === 'regional' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Regional & Language</h2>
                <p className="text-xs text-gray-400 mt-0.5">Controls how money and text appear across the app</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins size={11} /> Currency Symbol
                    </label>
                    <select value={form.currency_symbol}
                      onChange={e => setForm(f => ({ ...f, currency_symbol: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="$">$ USD — US Dollar</option>
                      <option value="£">£ GBP — British Pound</option>
                      <option value="€">€ EUR — Euro</option>
                      <option value="R$">R$ BRL — Brazilian Real</option>
                      <option value="CA$">CA$ CAD — Canadian Dollar</option>
                      <option value="A$">A$ AUD — Australian Dollar</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Languages size={11} /> Language
                    </label>
                    <select value={form.language}
                      onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="pt">Português</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT */}
          {activeSection === 'contact' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Contact & Socials</h2>
                <p className="text-xs text-gray-400 mt-0.5">Visible on your public booking page</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'phone',     label: 'Phone',     icon: Phone,     placeholder: '+1 (555) 000-0000'         },
                  { key: 'location',  label: 'Location',  icon: MapPin,    placeholder: 'City, State'               },
                  { key: 'website',   label: 'Website',   icon: Globe,     placeholder: 'https://yourwebsite.com'   },
                  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username (no @)'           },
                  { key: 'facebook',  label: 'Facebook',  icon: Facebook,  placeholder: 'https://facebook.com/page' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <field.icon size={11} /> {field.label}
                    </label>
                    <input value={(form as any)[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AVAILABILITY */}
          {activeSection === 'hours' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Weekly Availability</h2>
                <p className="text-xs text-gray-400 mt-0.5">Set which days and hours you accept bookings</p>
              </div>
              <div className="p-6 space-y-3">
                {DAYS.map(day => {
                  const s = availability[day];
                  return (
                    <div key={day} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${s.enabled ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                      <button type="button" onClick={() => toggleDay(day)}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${s.enabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-sm font-semibold w-24 flex-shrink-0 ${s.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                      {s.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select value={s.start} onChange={e => setDayTime(day, 'start', e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <span className="text-xs text-gray-400">to</span>
                          <select value={s.end} onChange={e => setDayTime(day, 'end', e.target.value)}
                            className="flex-1 px-2 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOOKING SETTINGS */}
          {activeSection === 'booking' && (
            <div className="space-y-5">
              {/* Booking URL */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Your Booking Link</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Share this with clients so they can book directly</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
                    <span className="text-sm text-gray-500 flex-1 truncate font-mono">{bookingUrl}</span>
                    <button onClick={copyBookingLink}
                      className="flex items-center gap-2 px-3 py-1.5 text-white text-xs font-semibold rounded-lg flex-shrink-0"
                      style={{ backgroundColor: form.theme_color }}>
                      {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                    <a href={bookingUrl} target="_blank"
                      className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <ExternalLink size={13} className="text-gray-500" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Booking rules */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Booking Rules</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Control when clients can book appointments</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Minimum Notice</label>
                    <p className="text-[10px] text-gray-300 mb-1">How far ahead clients must book</p>
                    <select value={form.booking_notice}
                      onChange={e => setForm(f => ({ ...f, booking_notice: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {[
                        { v: '2',  l: '2 hours'  },
                        { v: '4',  l: '4 hours'  },
                        { v: '8',  l: '8 hours'  },
                        { v: '12', l: '12 hours' },
                        { v: '24', l: '24 hours (1 day)'  },
                        { v: '48', l: '48 hours (2 days)' },
                        { v: '72', l: '72 hours (3 days)' },
                      ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Advance Booking</label>
                    <p className="text-[10px] text-gray-300 mb-1">How far ahead clients can schedule</p>
                    <select value={form.max_advance_days}
                      onChange={e => setForm(f => ({ ...f, max_advance_days: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {[
                        { v: '14',  l: '2 weeks'   },
                        { v: '30',  l: '1 month'   },
                        { v: '60',  l: '2 months'  },
                        { v: '90',  l: '3 months'  },
                        { v: '180', l: '6 months'  },
                      ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Payment Settings</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Clients are redirected here after booking to pay a deposit</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stripe Payment Link</label>
                    <input value={form.stripe_link}
                      onChange={e => setForm(f => ({ ...f, stripe_link: e.target.value }))}
                      placeholder="https://buy.stripe.com/..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-400">Leave blank to skip payment — clients just get a confirmation.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">How to Set Up Stripe</h2>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    'Go to dashboard.stripe.com and sign in or create an account',
                    'Navigate to Payment Links in the left sidebar',
                    'Create a new payment link for your deposit amount',
                    'Copy the link and paste it above',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: form.theme_color }}>{i + 1}</div>
                      <p className="text-sm text-gray-600">{text}</p>
                    </div>
                  ))}
                  <a href="https://dashboard.stripe.com/payment-links" target="_blank"
                    className="mt-2 flex items-center gap-2 text-sm font-semibold hover:opacity-80"
                    style={{ color: form.theme_color }}>
                    Open Stripe Dashboard <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Payments handled by Stripe</p>
                  <p className="text-xs text-amber-600 mt-1">Stripe charges 2.9% + 30¢ per transaction. No additional fees from Detailor.</p>
                </div>
              </div>
            </div>
          )}

          {/* PLAN */}
          {activeSection === 'plan' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Plan & Billing</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage your subscription and feature access</p>
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${form.theme_color}15` }}>
                      <Crown size={18} style={{ color: form.theme_color }} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">You're on the free tier</p>
                      <p className="text-xs text-gray-400 mt-0.5">Upgrade to unlock all features</p>
                    </div>
                  </div>
                  <a href="/dashboard/pricing"
                    className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-colors"
                    style={{ backgroundColor: form.theme_color }}>
                    <Crown size={14} /> View Plans
                  </a>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                  <p className="text-sm text-gray-500 mb-4">Redirecting you to the full pricing page where you can compare plans and upgrade.</p>
                  <a href="/dashboard/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl"
                    style={{ backgroundColor: form.theme_color }}>
                    <ExternalLink size={15} /> Open Pricing Page
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* SAVE BOTTOM */}
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
              style={{ backgroundColor: form.theme_color }}>
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}