"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Save, Upload, Globe, Instagram, Facebook,
  Phone, MapPin, Clock, Palette, Link2,
  CheckCircle2, AlertCircle, Eye, Copy, RefreshCw,
  Building2, Image, ChevronRight, Zap
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const THEME_COLORS = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Cyan', value: '#0891b2' },
  { label: 'Black', value: '#111111' },
  { label: 'Slate', value: '#475569' },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('business');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    instagram: '',
    facebook: '',
    theme_color: '#2563eb',
    stripe_link: '',
    cover_url: '',
    avatar_url: '',
    availability_json: {
      Monday: '9:00 AM - 5:00 PM',
      Tuesday: '9:00 AM - 5:00 PM',
      Wednesday: '9:00 AM - 5:00 PM',
      Thursday: '9:00 AM - 5:00 PM',
      Friday: '9:00 AM - 5:00 PM',
      Saturday: '10:00 AM - 3:00 PM',
      Sunday: 'Closed',
    } as Record<string, string>
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setForm({
          business_name: p.business_name || '',
          bio: p.bio || '',
          phone: p.phone || '',
          location: p.location || '',
          website: p.website || '',
          instagram: p.instagram || '',
          facebook: p.facebook || '',
          theme_color: p.theme_color || '#2563eb',
          stripe_link: p.stripe_link || '',
          cover_url: p.cover_url || p.banner_url || '',
          avatar_url: p.avatar_url || p.logo_url || '',
          availability_json: p.availability_json || {
            Monday: '9:00 AM - 5:00 PM',
            Tuesday: '9:00 AM - 5:00 PM',
            Wednesday: '9:00 AM - 5:00 PM',
            Thursday: '9:00 AM - 5:00 PM',
            Friday: '9:00 AM - 5:00 PM',
            Saturday: '10:00 AM - 3:00 PM',
            Sunday: 'Closed',
          },
        });
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
      setError('Cover upload failed. Make sure a "business-assets" storage bucket exists in Supabase.');
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
      setError('Logo upload failed. Make sure a "business-assets" storage bucket exists in Supabase.');
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    const slug = form.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      business_name: form.business_name,
      slug,
      bio: form.bio,
      phone: form.phone,
      location: form.location,
      website: form.website,
      instagram: form.instagram,
      facebook: form.facebook,
      theme_color: form.theme_color,
      primary_color: form.theme_color,
      stripe_link: form.stripe_link,
      cover_url: form.cover_url,
      banner_url: form.cover_url,
      avatar_url: form.avatar_url,
      logo_url: form.avatar_url,
      availability_json: form.availability_json,
    });
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  function copyBookingLink() {
    const slug = form.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const bookingSlug = form.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const bookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/book/${bookingSlug}` : `/book/${bookingSlug}`;

  const sections = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'contact', label: 'Contact & Socials', icon: Globe },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'payments', label: 'Payments', icon: Zap },
    { id: 'booking', label: 'Booking Link', icon: Link2 },
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
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold animate-in fade-in duration-300">
              <CheckCircle2 size={15} /> Saved!
            </span>
          )}
          <a href={bookingUrl} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-100">
            <Eye size={14} /> Preview
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
        <div className="flex-1 space-y-5">

          {/* BUSINESS INFO */}
          {activeSection === 'business' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Business Info</h2>
                <p className="text-xs text-gray-400 mt-0.5">Shows on your public booking page</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</label>
                  <input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                    placeholder="e.g. Elite Detail Studio"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">About / Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell clients what makes your business special..."
                    rows={4} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none transition-all" />
                  <p className="text-xs text-gray-300">{form.bio.length} / 300 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Cover */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Cover Photo</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Hero banner on your booking page — recommended 1200×400px</p>
                </div>
                <div className="p-6">
                  <div className="relative h-40 bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
                    onClick={() => coverInputRef.current?.click()}>
                    {form.cover_url
                      ? <>
                          <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-semibold flex items-center gap-2"><Upload size={15} /> Change</span>
                          </div>
                        </>
                      : <div className="flex flex-col items-center justify-center h-full">
                          {uploadingCover
                            ? <RefreshCw size={20} className="text-gray-300 animate-spin" />
                            : <><Image size={24} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400 font-medium">Click to upload cover photo</p></>}
                        </div>}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </div>
              </div>

              {/* Logo */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Logo / Avatar</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Recommended 400×400px</p>
                </div>
                <div className="p-6 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-black text-white cursor-pointer group relative"
                    style={{ backgroundColor: form.theme_color }}
                    onClick={() => avatarInputRef.current?.click()}>
                    {form.avatar_url
                      ? <img src={form.avatar_url} className="w-full h-full object-cover" alt="" />
                      : form.business_name?.charAt(0).toUpperCase() || '?'}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <Upload size={16} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <button onClick={() => avatarInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-100">
                      {uploadingAvatar ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                      Upload Logo
                    </button>
                    <p className="text-xs text-gray-400 mt-2">PNG or JPG</p>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
              </div>

              {/* Theme Color */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Theme Color</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Used for buttons, accents, and highlights on your booking page</p>
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
                    <input type="color" value={form.theme_color} onChange={e => setForm(f => ({ ...f, theme_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-100" />
                    <span className="text-sm font-mono text-gray-400">{form.theme_color}</span>
                  </div>

                  {/* PREVIEW */}
                  <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-400 mb-3">Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: form.theme_color }}>
                        {form.business_name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <button className="px-4 py-2 text-white text-sm font-semibold rounded-lg" style={{ backgroundColor: form.theme_color }}>
                        Book Now
                      </button>
                      <span className="text-sm font-black" style={{ color: form.theme_color }}>$149</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT */}
          {activeSection === 'contact' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Contact & Socials</h2>
                <p className="text-xs text-gray-400 mt-0.5">Visible on your public booking page</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+1 (555) 000-0000' },
                  { key: 'location', label: 'Location', icon: MapPin, placeholder: 'City, State' },
                  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
                  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username (no @)' },
                  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <field.icon size={11} /> {field.label}
                    </label>
                    <input value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HOURS */}
          {activeSection === 'hours' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Business Hours</h2>
                <p className="text-xs text-gray-400 mt-0.5">Shown on your booking page — type "Closed" for days off</p>
              </div>
              <div className="p-6 space-y-3">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">{day}</span>
                    <input
                      value={form.availability_json[day] || ''}
                      onChange={e => setForm(f => ({ ...f, availability_json: { ...f.availability_json, [day]: e.target.value } }))}
                      placeholder="9:00 AM - 5:00 PM"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all" />
                    <button onClick={() => setForm(f => ({ ...f, availability_json: { ...f.availability_json, [day]: 'Closed' } }))}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${form.availability_json[day] === 'Closed' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'}`}>
                      Closed
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Payment Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customers are redirected here after booking to pay a deposit</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stripe Payment Link</label>
                  <input value={form.stripe_link} onChange={e => setForm(f => ({ ...f, stripe_link: e.target.value }))}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all" />
                  <p className="text-xs text-gray-400">Leave blank to skip the payment step — customers just receive a confirmation email.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 mb-2">How to get your Stripe link</p>
                  <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Go to <strong>dashboard.stripe.com</strong> → Payment Links</li>
                    <li>Create a new link for your deposit amount</li>
                    <li>Copy the link and paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* BOOKING LINK */}
          {activeSection === 'booking' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900">Your Booking Link</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Share this with clients so they can book directly</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500 flex-1 truncate font-mono">{bookingUrl}</span>
                    <button onClick={copyBookingLink}
                      className="flex items-center gap-2 px-3 py-1.5 text-white text-xs font-semibold rounded-lg flex-shrink-0 transition-all"
                      style={{ backgroundColor: form.theme_color }}>
                      {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>

                  <a href={bookingUrl} target="_blank"
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                        style={{ backgroundColor: form.theme_color }}>
                        {form.business_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{form.business_name || 'Your Business'}</p>
                        <p className="text-xs text-gray-400">Click to preview your booking page</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </a>

                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Share your link</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Instagram Bio', bg: '#e1306c' },
                        { label: 'Facebook', bg: '#1877f2' },
                        { label: 'Text Message', bg: '#34c759' },
                      ].map(s => (
                        <button key={s.label} onClick={copyBookingLink}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold"
                          style={{ backgroundColor: s.bg }}>
                          <Copy size={11} /> {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
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