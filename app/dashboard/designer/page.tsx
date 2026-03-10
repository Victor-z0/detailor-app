"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Save, RefreshCw, ExternalLink, AlertCircle, CheckCircle2,
  Monitor, Smartphone, Pencil, Image as ImageIcon,
  X, Upload, Check,
} from 'lucide-react';

interface PageConfig {
  hero_headline:    string;
  hero_subheadline: string;
  hero_cta_text:    string;
  hero_cta_color:   string;
  hero_style:       'cover' | 'gradient' | 'minimal';
  show_about:       boolean;
  about_title:      string;
  show_services:    boolean;
  services_title:   string;
  show_gallery:     boolean;
  gallery_title:    string;
  show_contact:     boolean;
  logo_url:         string;
  cover_url:        string;
  theme_color:      string;
  font_style:       'modern' | 'classic' | 'bold';
  dark_mode:        boolean;
  show_powered_by:  boolean;
}

const DEFAULTS: PageConfig = {
  hero_headline:    'Book Your Detail Today',
  hero_subheadline: 'Premium auto detailing. Easy online booking. Fast results.',
  hero_cta_text:    'Book Now',
  hero_cta_color:   '#2563eb',
  hero_style:       'cover',
  show_about:       true,
  about_title:      'About Us',
  show_services:    true,
  services_title:   'Our Services',
  show_gallery:     true,
  gallery_title:    'Our Work',
  show_contact:     true,
  logo_url:         '',
  cover_url:        '',
  theme_color:      '#2563eb',
  font_style:       'modern',
  dark_mode:        false,
  show_powered_by:  true,
};

function EditPopover({ label, value, onSave, onClose, multiline = false }: {
  label: string; value: string; onSave: (v: string) => void;
  onClose: () => void; multiline?: boolean;
}) {
  const [val, setVal] = useState(value);
  return (
    <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      {multiline
        ? <textarea className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} value={val} onChange={e => setVal(e.target.value)} autoFocus />
        : <input className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" value={val} onChange={e => setVal(e.target.value)} autoFocus />
      }
      <div className="flex gap-2 mt-3">
        <button onClick={onClose} className="flex-1 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
        <button onClick={() => { onSave(val); onClose(); }} className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
          <Check size={12} /> Apply
        </button>
      </div>
    </div>
  );
}

function Editable({ label, value, onChange, children, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; multiline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div ref={ref} className="relative group/edit inline-block">
      <div className="relative cursor-pointer" onClick={() => setOpen(true)}>
        {children}
        <span className="absolute -top-1 -right-1 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-blue-600 text-white rounded-full p-0.5 shadow-md pointer-events-none z-10">
          <Pencil size={9} />
        </span>
        <div className="absolute inset-0 opacity-0 group-hover/edit:opacity-100 transition-opacity border-2 border-dashed border-blue-400 rounded-lg pointer-events-none" />
      </div>
      {open && <EditPopover label={label} value={value} onSave={onChange} onClose={() => setOpen(false)} multiline={multiline} />}
    </div>
  );
}

function Toggle({ enabled, onToggle, color }: { enabled: boolean; onToggle: () => void; color: string }) {
  return (
    <button onClick={onToggle} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: enabled ? color : '#e5e7eb' }}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function PageDesignerPage() {
  const [config,    setConfig]   = useState<PageConfig>(DEFAULTS);
  const [slug,      setSlug]     = useState('');
  const [userId,    setUserId]   = useState('');
  const [saving,    setSaving]   = useState(false);
  const [saved,     setSaved]    = useState(false);
  const [error,     setError]    = useState('');
  const [device,    setDevice]   = useState<'desktop' | 'mobile' | 'controls'>('controls');
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const logoRef  = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const bookingUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}` : '';

  function set<K extends keyof PageConfig>(key: K, value: PageConfig[K]) {
    setConfig(c => ({ ...c, [key]: value }));
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('profiles')
        .select('slug, page_config, theme_color, cover_url, logo_url, avatar_url')
        .eq('id', user.id).single();
      if (data) {
        setSlug(data.slug ?? '');
        const saved = data.page_config as Partial<PageConfig> | null;
        setConfig({
          ...DEFAULTS,
          theme_color:    data.theme_color ?? DEFAULTS.theme_color,
          hero_cta_color: data.theme_color ?? DEFAULTS.hero_cta_color,
          cover_url:      data.cover_url  ?? '',
          logo_url:       data.logo_url   ?? data.avatar_url ?? '',
          ...(saved ?? {}),
        });
      }
    })();
  }, []);

  async function uploadFile(file: File, path: string) {
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('business-assets').getPublicUrl(path).data.publicUrl;
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !userId) return;
    setUploading('logo'); setError('');
    try {
      const ext = file.name.split('.').pop();
      const url = await uploadFile(file, `${userId}/page-logo.${ext}`);
      set('logo_url', url);
    } catch (err: any) { setError(`Logo upload failed: ${err.message}`); }
    setUploading(null);
    if (logoRef.current) logoRef.current.value = '';
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !userId) return;
    setUploading('cover'); setError('');
    try {
      const ext = file.name.split('.').pop();
      const url = await uploadFile(file, `${userId}/page-cover.${ext}`);
      set('cover_url', url);
    } catch (err: any) { setError(`Cover upload failed: ${err.message}`); }
    setUploading(null);
    if (coverRef.current) coverRef.current.value = '';
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true); setError('');
    // Page Designer ONLY saves page_config and theme_color
    // Settings page controls avatar_url, cover_url, logo_url on the profile
    const { error } = await supabase.from('profiles').update({
      page_config: config,
      theme_color: config.theme_color,
    }).eq('id', userId);
    setSaving(false);
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  const dark = config.dark_mode;
  const textPrimary   = dark ? 'text-white'     : 'text-gray-900';
  const textSecondary = dark ? 'text-white/50'  : 'text-gray-500';
  const borderColor   = dark ? 'border-white/5' : 'border-gray-100';
  const bgSection     = dark ? 'bg-white/5'     : 'bg-gray-50';

  return (
    <div className="max-w-7xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Page Designer</h1>
          <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">
            Customize your <strong>client booking page</strong> — click any element in the preview to edit
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="hidden sm:flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 size={15} /> Published!</span>}
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-100 transition-colors">
              <ExternalLink size={14} /> View Live
            </a>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            style={{ backgroundColor: config.theme_color }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-5">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Upload Error</p>
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-500">
              Go to Supabase → Storage → business-assets → Policies → Add INSERT policy for authenticated users with definition: <code>(auth.uid()::text = (storage.foldername(name))[1])</code>
            </p>
          </div>
        </div>
      )}

      {/* Mobile tab toggle between controls/preview */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-4 lg:hidden w-fit">
        <button onClick={() => setDevice('controls' as any)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: device === 'controls' ? '#fff' : 'transparent', color: device === 'controls' ? '#111827' : '#9ca3af', boxShadow: device === 'controls' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>
          Controls
        </button>
        <button onClick={() => setDevice('mobile')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: device === 'mobile' ? '#fff' : 'transparent', color: device === 'mobile' ? '#111827' : '#9ca3af', boxShadow: device === 'mobile' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>
          Preview
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

        {/* ─── LEFT: Controls ─── */}
        <div className={`space-y-4 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-1 ${device === 'mobile' ? 'hidden lg:block' : ''}`}>

          {/* Branding */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Branding</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Logo / Avatar</p>
              <div className="flex items-center gap-3">
                <div onClick={() => logoRef.current?.click()}
                  className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative group">
                  {config.logo_url
                    ? <img src={config.logo_url} className="w-full h-full object-cover" alt="logo" />
                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-gray-300" /></div>
                  }
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <Upload size={14} className="text-white" />
                  </div>
                </div>
                <button onClick={() => logoRef.current?.click()} disabled={uploading === 'logo'}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors">
                  {uploading === 'logo' ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                  {uploading === 'logo' ? 'Uploading...' : config.logo_url ? 'Replace Logo' : 'Upload Logo'}
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Cover / Hero Image</p>
              <div onClick={() => coverRef.current?.click()}
                className="relative h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity group">
                {config.cover_url
                  ? <img src={config.cover_url} className="w-full h-full object-cover" alt="cover" />
                  : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon size={20} className="mb-1" /><span className="text-xs">Click to upload</span>
                    </div>
                }
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading === 'cover' ? <RefreshCw size={18} className="text-white animate-spin" /> : <Upload size={18} className="text-white" />}
                </div>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Brand Color</p>
              <div className="flex items-center gap-3">
                <input type="color" value={config.theme_color}
                  onChange={e => { set('theme_color', e.target.value); set('hero_cta_color', e.target.value); }}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-gray-100 p-0.5" />
                <span className="text-sm font-mono text-gray-600">{config.theme_color}</span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hero Section</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Hero Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['cover', 'gradient', 'minimal'] as const).map(s => (
                    <button key={s} onClick={() => set('hero_style', s)}
                      className="py-2 text-xs font-semibold rounded-xl capitalize transition-all"
                      style={{ backgroundColor: config.hero_style === s ? config.theme_color : '#f9fafb', color: config.hero_style === s ? '#fff' : '#6b7280' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Headline</p>
                <input value={config.hero_headline} onChange={e => set('hero_headline', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Subheadline</p>
                <textarea value={config.hero_subheadline} onChange={e => set('hero_subheadline', e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Button Text</p>
                  <input value={config.hero_cta_text} onChange={e => set('hero_cta_text', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Button Color</p>
                  <input type="color" value={config.hero_cta_color} onChange={e => set('hero_cta_color', e.target.value)}
                    className="w-full h-9 rounded-xl cursor-pointer border border-gray-100 p-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Page Sections</p>
            <div className="space-y-1">
              {[
                { label: 'About / Bio',  key: 'show_about'    as const },
                { label: 'Services',     key: 'show_services' as const },
                { label: 'Gallery',      key: 'show_gallery'  as const },
                { label: 'Contact Info', key: 'show_contact'  as const },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <Toggle enabled={config[key] as boolean} onToggle={() => set(key, !config[key] as any)} color={config.theme_color} />
                </div>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Style</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Font Style</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['modern', 'classic', 'bold'] as const).map(f => (
                    <button key={f} onClick={() => set('font_style', f)}
                      className="py-2 text-xs font-semibold rounded-xl capitalize transition-all"
                      style={{ backgroundColor: config.font_style === f ? config.theme_color : '#f9fafb', color: config.font_style === f ? '#fff' : '#6b7280' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                  <p className="text-xs text-gray-400">Dark background for booking page</p>
                </div>
                <Toggle enabled={config.dark_mode} onToggle={() => set('dark_mode', !config.dark_mode)} color="#111827" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">"Powered by Detailor"</p>
                  <p className="text-xs text-gray-400">Badge at bottom of your page</p>
                </div>
                <Toggle enabled={config.show_powered_by} onToggle={() => set('show_powered_by', !config.show_powered_by)} color={config.theme_color} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Preview ─── */}
        <div className={`flex flex-col ${device === 'controls' ? 'hidden lg:flex' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setDevice('desktop')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: device === 'desktop' ? '#fff' : 'transparent', color: device === 'desktop' ? '#111827' : '#9ca3af', boxShadow: device === 'desktop' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>
                <Monitor size={13} /> Desktop
              </button>
              <button onClick={() => setDevice('mobile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: device === 'mobile' ? '#fff' : 'transparent', color: device === 'mobile' ? '#111827' : '#9ca3af', boxShadow: device === 'mobile' ? '0 1px 2px rgba(0,0,0,.1)' : 'none' }}>
                <Smartphone size={13} /> Mobile
              </button>
            </div>
            <p className="text-xs text-gray-400 ml-1 hidden sm:block">
              <Pencil size={11} className="inline mr-1 mb-0.5" />
              Click any element in the preview to edit
            </p>
          </div>

          <div className="flex justify-center">
            <div className={`transition-all duration-300 border border-gray-200 rounded-2xl overflow-hidden shadow-xl ${device === 'mobile' ? 'w-[375px]' : 'w-full'}`}
              style={{ backgroundColor: dark ? '#0f172a' : '#ffffff', minHeight: 600 }}>

              {/* Hero */}
              <div className="relative overflow-hidden" style={{
                minHeight: 240,
                background: config.hero_style === 'gradient'
                  ? `linear-gradient(135deg, ${config.theme_color}, ${config.theme_color}99)`
                  : config.hero_style === 'minimal'
                  ? dark ? '#1e293b' : '#f8fafc'
                  : config.cover_url
                  ? `url(${config.cover_url}) center/cover no-repeat`
                  : `linear-gradient(135deg, ${config.theme_color}33, ${config.theme_color}55)`,
              }}>
                {config.hero_style === 'cover' && config.cover_url && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 min-h-[240px] gap-3">

                  {/* Logo */}
                  {config.logo_url
                    ? <Editable label="Logo" value={config.logo_url} onChange={v => set('logo_url', v)}>
                        <img src={config.logo_url} className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow-md" alt="logo" />
                      </Editable>
                    : <button onClick={() => logoRef.current?.click()}
                        className="w-12 h-12 rounded-full bg-white/20 border-2 border-dashed border-white/40 flex items-center justify-center hover:bg-white/30 transition-colors group">
                        <Upload size={14} className={config.hero_style === 'minimal' && !dark ? 'text-gray-400' : 'text-white/60'} />
                      </button>
                  }

                  {/* Headline */}
                  <Editable label="Headline" value={config.hero_headline} onChange={v => set('hero_headline', v)}>
                    <h1 className={`text-2xl font-black leading-tight ${config.hero_style === 'minimal' && !dark ? 'text-gray-900' : 'text-white'} ${config.font_style === 'bold' ? 'uppercase tracking-tight' : ''}`}>
                      {config.hero_headline}
                    </h1>
                  </Editable>

                  {/* Subheadline */}
                  <Editable label="Subheadline" value={config.hero_subheadline} onChange={v => set('hero_subheadline', v)} multiline>
                    <p className={`text-sm max-w-sm ${config.hero_style === 'minimal' && !dark ? 'text-gray-500' : 'text-white/80'}`}>
                      {config.hero_subheadline}
                    </p>
                  </Editable>

                  {/* CTA Button */}
                  <Editable label="Button Text" value={config.hero_cta_text} onChange={v => set('hero_cta_text', v)}>
                    <div className="px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: config.hero_cta_color }}>
                      {config.hero_cta_text}
                    </div>
                  </Editable>
                </div>

                {/* Add cover button when empty */}
                {!config.cover_url && config.hero_style === 'cover' && (
                  <button onClick={() => coverRef.current?.click()}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-semibold rounded-xl transition-colors">
                    <Upload size={11} /> Add Cover Photo
                  </button>
                )}
              </div>

              {/* About */}
              {config.show_about && (
                <div className={`px-6 py-5 border-b ${borderColor}`}>
                  <Editable label="About Title" value={config.about_title} onChange={v => set('about_title', v)}>
                    <h2 className={`text-base font-bold mb-2 ${textPrimary}`}>{config.about_title}</h2>
                  </Editable>
                  <p className={`text-sm ${textSecondary}`}>Your bio from Settings will appear here.</p>
                </div>
              )}

              {/* Services */}
              {config.show_services && (
                <div className={`px-6 py-5 border-b ${borderColor}`}>
                  <Editable label="Services Title" value={config.services_title} onChange={v => set('services_title', v)}>
                    <h2 className={`text-base font-bold mb-3 ${textPrimary}`}>{config.services_title}</h2>
                  </Editable>
                  <div className="space-y-2">
                    {['Full Detail — $150', 'Ceramic Coating — $800', 'Paint Correction — $400'].map(s => (
                      <div key={s} className={`flex items-center justify-between p-3 rounded-xl ${bgSection}`}>
                        <span className={`text-xs font-semibold ${textPrimary}`}>{s}</span>
                        <div className="px-3 py-1 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: config.theme_color }}>Book</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery */}
              {config.show_gallery && (
                <div className={`px-6 py-5 border-b ${borderColor}`}>
                  <Editable label="Gallery Title" value={config.gallery_title} onChange={v => set('gallery_title', v)}>
                    <h2 className={`text-base font-bold mb-3 ${textPrimary}`}>{config.gallery_title}</h2>
                  </Editable>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`aspect-square rounded-xl ${bgSection} flex items-center justify-center`}>
                        <ImageIcon size={16} className={dark ? 'text-white/20' : 'text-gray-300'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Powered by */}
              {config.show_powered_by && (
                <div className="px-6 py-4 text-center">
                  <span className={`text-xs ${dark ? 'text-white/20' : 'text-gray-300'}`}>Powered by <strong>Detailor</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}