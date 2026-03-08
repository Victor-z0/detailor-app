"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/settingsContext';
import {
  Eye, Save, RefreshCw, CheckCircle2, AlertCircle,
  Layout, Type, Image, Star, Clock, Phone,
  ChevronUp, ChevronDown, ToggleLeft, GripVertical,
  Palette, Monitor, Smartphone, ExternalLink,
  CheckSquare, Square, Layers
} from 'lucide-react';

// All possible sections on the public booking page
const ALL_SECTIONS = [
  { id: 'hero',         label: 'Hero Banner',       desc: 'Cover photo + business name',        icon: Image   },
  { id: 'about',        label: 'About / Bio',        desc: 'Your business description',          icon: Type    },
  { id: 'services',     label: 'Services Menu',      desc: 'List of services with prices',       icon: Star    },
  { id: 'gallery',      label: 'Photo Gallery',      desc: 'Lookbook / portfolio photos',        icon: Image   },
  { id: 'hours',        label: 'Business Hours',     desc: 'Weekly availability schedule',       icon: Clock   },
  { id: 'contact',      label: 'Contact Info',       desc: 'Phone, location, socials',           icon: Phone   },
  { id: 'booking',      label: 'Booking Form',       desc: 'Date/time/service selector',         icon: Layout  },
  { id: 'reviews',      label: 'Reviews',            desc: 'Star ratings from clients',          icon: Star    },
];

const FONT_OPTIONS = [
  { id: 'inter',    label: 'Inter',         preview: 'Modern & Clean'    },
  { id: 'poppins',  label: 'Poppins',       preview: 'Rounded & Friendly' },
  { id: 'playfair', label: 'Playfair',      preview: 'Elegant & Luxury'  },
  { id: 'mono',     label: 'Monospace',     preview: 'Technical & Bold'  },
];

const LAYOUT_OPTIONS = [
  { id: 'classic',   label: 'Classic',    desc: 'Centered, clean layout'       },
  { id: 'bold',      label: 'Bold',       desc: 'Full-width hero, big text'     },
  { id: 'minimal',   label: 'Minimal',    desc: 'Less is more, whitespace heavy' },
  { id: 'card',      label: 'Card',       desc: 'Content in floating cards'     },
];

type PageConfig = {
  layout:           string;
  font:             string;
  theme_color:      string;
  dark_mode:        boolean;
  section_order:    string[];
  hidden_sections:  string[];
  hero_style:       string;  // 'cover' | 'gradient' | 'minimal'
  show_badge:       boolean; // "Powered by Detailor" badge
};

const DEFAULT_CONFIG: PageConfig = {
  layout:          'classic',
  font:            'inter',
  theme_color:     '#2563eb',
  dark_mode:       false,
  section_order:   ALL_SECTIONS.map(s => s.id),
  hidden_sections: ['reviews'],
  hero_style:      'cover',
  show_badge:      true,
};

export default function PageDesignerPage() {
  const { settings, reload } = useSettings();
  const [userId,   setUserId]   = useState('');
  const [slug,     setSlug]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [preview,  setPreview]  = useState<'desktop' | 'mobile'>('desktop');
  const [config,   setConfig]   = useState<PageConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('profiles')
        .select('slug, theme_color, page_config')
        .eq('id', user.id).single();
      if (data) {
        setSlug(data.slug || '');
        const base = { ...DEFAULT_CONFIG, theme_color: data.theme_color || DEFAULT_CONFIG.theme_color };
        if (data.page_config) {
          try { setConfig({ ...base, ...JSON.parse(data.page_config) }); }
          catch { setConfig(base); }
        } else {
          setConfig(base);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError('');
    const { error } = await supabase.from('profiles').update({
      theme_color: config.theme_color,
      page_config: JSON.stringify(config),
    }).eq('id', userId);
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); reload(); }
    setSaving(false);
  }

  function moveSection(id: string, dir: 'up' | 'down') {
    setConfig(c => {
      const arr = [...c.section_order];
      const i = arr.indexOf(id);
      if (dir === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      if (dir === 'down' && i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return { ...c, section_order: arr };
    });
  }

  function toggleSection(id: string) {
    setConfig(c => {
      const hidden = c.hidden_sections.includes(id)
        ? c.hidden_sections.filter(s => s !== id)
        : [...c.hidden_sections, id];
      return { ...c, hidden_sections: hidden };
    });
  }

  const visibleSections = config.section_order.filter(id => !config.hidden_sections.includes(id));
  const bookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Designer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Customize how your public booking page looks to clients</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle2 size={15} /> Saved!
            </span>
          )}
          <a href={bookingUrl} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-100 transition-colors">
            <ExternalLink size={14} /> Live Page
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            style={{ backgroundColor: config.theme_color }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 mb-5">
          <AlertCircle size={15} /> {error}
          <p className="text-xs mt-0.5 text-red-400">Run migration-v2.sql in Supabase to add the page_config column.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* LEFT: Controls */}
        <div className="space-y-5">

          {/* Layout */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Layers size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Layout Style</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map(l => (
                <button key={l.id} onClick={() => setConfig(c => ({ ...c, layout: l.id }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${config.layout === l.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  style={config.layout === l.id ? { borderColor: config.theme_color, backgroundColor: `${config.theme_color}10` } : {}}>
                  <p className={`text-xs font-bold ${config.layout === l.id ? 'text-blue-600' : 'text-gray-700'}`}
                    style={config.layout === l.id ? { color: config.theme_color } : {}}>{l.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Palette size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Brand Color</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {['#2563eb','#7c3aed','#e11d48','#ea580c','#059669','#0891b2','#111111','#475569'].map(c => (
                  <button key={c} onClick={() => setConfig(cfg => ({ ...cfg, theme_color: c }))}
                    className="w-8 h-8 rounded-xl transition-all hover:scale-110 relative shadow-sm flex-shrink-0"
                    style={{ backgroundColor: c }}>
                    {config.theme_color === c && <CheckCircle2 size={14} className="text-white absolute inset-0 m-auto drop-shadow" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input type="color" value={config.theme_color}
                  onChange={e => setConfig(c => ({ ...c, theme_color: e.target.value }))}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-gray-100 p-0.5" />
                <span className="text-xs font-mono text-gray-500">{config.theme_color}</span>
                <div className="ml-auto text-[10px] font-bold text-white px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: config.theme_color }}>Preview</div>
              </div>
            </div>
          </div>

          {/* Font */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Type size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Font Style</h2>
            </div>
            <div className="p-4 space-y-2">
              {FONT_OPTIONS.map(f => (
                <button key={f.id} onClick={() => setConfig(c => ({ ...c, font: f.id }))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${config.font === f.id ? 'border-blue-500' : 'border-gray-100 hover:border-gray-200'}`}
                  style={config.font === f.id ? { borderColor: config.theme_color } : {}}>
                  <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                  <span className="text-xs text-gray-400">{f.preview}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hero Style */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Image size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Hero Style</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { id: 'cover',    label: 'Cover Photo',  desc: 'Full-width image banner' },
                { id: 'gradient', label: 'Gradient',     desc: 'Color gradient using brand color' },
                { id: 'minimal',  label: 'Minimal',      desc: 'Just name and tagline, no image' },
              ].map(h => (
                <button key={h.id} onClick={() => setConfig(c => ({ ...c, hero_style: h.id }))}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${config.hero_style === h.id ? 'border-blue-500' : 'border-gray-100 hover:border-gray-200'}`}
                  style={config.hero_style === h.id ? { borderColor: config.theme_color } : {}}>
                  <span className="text-sm font-semibold text-gray-800">{h.label}</span>
                  <span className="text-xs text-gray-400">{h.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Misc toggles */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900 text-sm">Other Options</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { key: 'dark_mode',   label: 'Dark Mode Page',        desc: 'Dark background for your booking page' },
                { key: 'show_badge',  label: 'Show "Powered by" Badge', desc: 'Small Detailor badge in footer' },
              ].map(opt => (
                <div key={opt.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  <button onClick={() => setConfig(c => ({ ...c, [opt.key]: !(c as any)[opt.key] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${(config as any)[opt.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                    style={(config as any)[opt.key] ? { backgroundColor: config.theme_color } : {}}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(config as any)[opt.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT: Section order + preview */}
        <div className="space-y-5">

          {/* Section Manager */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout size={14} className="text-gray-400" />
                <h2 className="font-bold text-gray-900 text-sm">Page Sections</h2>
              </div>
              <p className="text-xs text-gray-400">{visibleSections.length} visible · drag to reorder</p>
            </div>
            <div className="p-4 space-y-2">
              {config.section_order.map((id, idx) => {
                const section = ALL_SECTIONS.find(s => s.id === id);
                if (!section) return null;
                const isVisible = !config.hidden_sections.includes(id);
                const Icon = section.icon;
                return (
                  <div key={id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isVisible ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <GripVertical size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isVisible ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                      style={isVisible ? { backgroundColor: config.theme_color } : {}}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                      <p className="text-xs text-gray-400 truncate">{section.desc}</p>
                    </div>
                    {/* Up/down */}
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveSection(id, 'up')} disabled={idx === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 transition-colors">
                        <ChevronUp size={12} className="text-gray-500" />
                      </button>
                      <button onClick={() => moveSection(id, 'down')} disabled={idx === config.section_order.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 transition-colors">
                        <ChevronDown size={12} className="text-gray-500" />
                      </button>
                    </div>
                    {/* Toggle visibility */}
                    <button onClick={() => toggleSection(id)}
                      className={`p-2 rounded-lg transition-colors text-xs font-bold ${isVisible ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {isVisible ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Preview */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-gray-400" />
                <h2 className="font-bold text-gray-900 text-sm">Preview</h2>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setPreview('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${preview === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
                  <Monitor size={13} className="text-gray-600" />
                </button>
                <button onClick={() => setPreview('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${preview === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}>
                  <Smartphone size={13} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 flex justify-center bg-gray-50">
              <div className={`transition-all duration-300 ${preview === 'mobile' ? 'w-48' : 'w-full'}`}>
                <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm ${config.dark_mode ? 'bg-gray-900' : 'bg-white'}`}
                  style={{ minHeight: 280 }}>
                  {/* Hero preview */}
                  <div className="h-24 flex items-end px-4 pb-3 relative overflow-hidden"
                    style={{
                      background: config.hero_style === 'gradient'
                        ? `linear-gradient(135deg, ${config.theme_color}, ${config.theme_color}88)`
                        : config.hero_style === 'minimal'
                        ? config.dark_mode ? '#111' : '#f9fafb'
                        : `linear-gradient(to bottom, ${config.theme_color}44, ${config.theme_color}88)`,
                    }}>
                    <div>
                      <div className={`text-xs font-black ${config.hero_style === 'minimal' && !config.dark_mode ? 'text-gray-900' : 'text-white'}`}>
                        Your Business
                      </div>
                      <div className={`text-[8px] mt-0.5 ${config.hero_style === 'minimal' && !config.dark_mode ? 'text-gray-500' : 'text-white/70'}`}>
                        Premium Detailing Services
                      </div>
                    </div>
                  </div>
                  {/* Section previews */}
                  <div className="p-3 space-y-1.5">
                    {config.section_order
                      .filter(id => !config.hidden_sections.includes(id))
                      .slice(0, 5)
                      .map(id => {
                        const s = ALL_SECTIONS.find(x => x.id === id);
                        return s ? (
                          <div key={id} className={`h-6 rounded-md flex items-center px-2 gap-1.5 ${config.dark_mode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.theme_color }} />
                            <span className={`text-[8px] font-semibold ${config.dark_mode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</span>
                          </div>
                        ) : null;
                      })}
                    <div className="h-8 rounded-md flex items-center justify-center text-[8px] font-bold text-white mt-2"
                      style={{ backgroundColor: config.theme_color }}>
                      Book Now
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Changes publish instantly</p>
              <p className="text-xs text-blue-600 mt-0.5">After saving, your public booking page at <span className="font-mono">{bookingUrl}</span> will reflect the new design for all clients.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
