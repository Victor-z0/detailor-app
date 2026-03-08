"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Save, Globe, Image as ImageIcon, 
  Clock, Upload, Loader2, RefreshCw,
  Copy, Check, ExternalLink
} from 'lucide-react';

export default function StudioSettings({ session }: { session: any }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState({
    business_name: '',
    bio: '',
    location: '',
    logo_url: '',
    banner_url: '',
    availability_json: {}
  });

  // Generate the slug for the public URL
  const publicSlug = profile.business_name?.toLowerCase().replace(/\s+/g, '-');
  const bookingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/book/${publicSlug}` 
    : '';

  useEffect(() => {
    async function getProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (data) setProfile(data);
    }
    getProfile();
  }, [session]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    try {
      setUploading(type);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${type}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `studio-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('studio-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('studio-assets')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
      
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', session.user.id);
    
    if (error) alert(error.message);
    else alert("Protocol_Updated: Profile changes committed to core.");
    setLoading(false);
  };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tightest lowercase mb-2">studio_config.</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Customize your public-facing terminal</p>
        </div>
        
        {/* LIVE PREVIEW BRIDGE */}
        <a 
          href={`/book/${publicSlug}`}
          target="_blank"
          className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all group shadow-xl"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Live_Preview</span>
          <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>
      </header>

      {/* BOOKING LINK CARD */}
      <section className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Public_Access_Terminal</p>
          <p className="font-mono text-xs text-gray-500 truncate max-w-xs md:max-w-md">{bookingUrl}</p>
        </div>
        <button 
          onClick={copyToClipboard}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl hover:border-black transition-all active:scale-95"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy_Link'}</span>
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* BRANDING SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 italic">
            <Globe size={14} /> Identity_Protocol
          </div>
          
          <div className="space-y-4">
            <div className="group">
              <label className="text-[9px] font-black uppercase mb-2 block text-gray-400">Studio_Name</label>
              <input 
                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                value={profile.business_name}
                onChange={(e) => setProfile({...profile, business_name: e.target.value})}
              />
            </div>

            <div className="group">
              <label className="text-[9px] font-black uppercase mb-2 block text-gray-400">Bio_Manifesto</label>
              <textarea 
                rows={3}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* ASSET UPLOAD SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 italic">
            <ImageIcon size={14} /> Visual_Assets
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-400 italic">Profile_Logo</label>
              <div className="relative aspect-square w-full bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden group">
                {profile.logo_url ? (
                  <img src={profile.logo_url} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                ) : (
                  <Upload size={24} className="text-gray-200" />
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all bg-black/10 backdrop-blur-sm">
                  {uploading === 'logo' ? <Loader2 className="animate-spin text-black" /> : <span className="text-[8px] font-black text-black uppercase bg-white px-3 py-1 rounded-full shadow-lg">Upload_New</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'logo')} disabled={!!uploading} />
                </label>
              </div>
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-400 italic">Hero_Banner</label>
              <div className="relative aspect-square w-full bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center overflow-hidden group">
                {profile.banner_url ? (
                  <img src={profile.banner_url} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                ) : (
                  <Upload size={24} className="text-gray-200" />
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all bg-black/10 backdrop-blur-sm">
                  {uploading === 'banner' ? <Loader2 className="animate-spin text-black" /> : <span className="text-[8px] font-black text-black uppercase bg-white px-3 py-1 rounded-full shadow-lg">Upload_New</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadFile(e, 'banner')} disabled={!!uploading} />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* HOURS CONFIGURATION */}
      <section className="space-y-6 pt-8 border-t border-gray-50">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 italic">
          <Clock size={14} /> Operational_Hours
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
            <div key={day} className="p-4 bg-gray-50 rounded-2xl group hover:bg-black transition-colors duration-500">
              <label className="text-[9px] font-black uppercase block mb-2 text-gray-400 group-hover:text-white/40">{day}</label>
              <input 
                className="w-full bg-transparent border-none text-xs font-bold outline-none italic group-hover:text-white"
                value={(profile.availability_json as any)[day] || ''}
                onChange={(e) => {
                  const newHours = { ...(profile.availability_json as object), [day]: e.target.value };
                  setProfile({...profile, availability_json: newHours});
                }}
                placeholder="09:00 - 17:00"
              />
            </div>
          ))}
        </div>
      </section>

      <button 
        onClick={handleSave}
        disabled={loading}
        className="fixed bottom-12 right-12 bg-black text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-50"
      >
        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
        Commit_Changes
      </button>
    </div>
  );
}