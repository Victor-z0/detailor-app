"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Upload, Star, Trash2, X, Camera, Film,
  Loader2, Edit2, Grid3X3, LayoutList,
  AlertCircle, Plus
} from 'lucide-react';

type MediaItem = {
  id: string;
  user_id: string;
  image_url: string;
  media_type?: 'image' | 'video';
  caption?: string;
  featured: boolean;
  created_at: string;
};

export default function GalleryPage() {
  const [gallery,   setGallery]   = useState<MediaItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [lightbox,  setLightbox]  = useState<MediaItem | null>(null);
  const [editItem,  setEditItem]  = useState<MediaItem | null>(null);
  const [caption,   setCaption]   = useState('');
  const [view,      setView]      = useState<'grid' | 'list'>('grid');
  const [tab,       setTab]       = useState<'all' | 'featured' | 'videos'>('all');
  const [error,     setError]     = useState('');
  const [progress,  setProgress]  = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      fetchGallery(user.id);
    });
  }, []);

  async function fetchGallery(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_items').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setGallery((data || []) as MediaItem[]);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !userId) return;
    setError('');
    setUploading(true);
    let done = 0;
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const ext  = file.name.split('.').pop();
      const path = `${userId}/gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('business-assets').upload(path, file, { upsert: true });
      if (upErr) {
        setError(`Upload failed: ${upErr.message}. Make sure "business-assets" bucket exists in Supabase Storage with Public: ON.`);
        continue;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('business-assets').getPublicUrl(path);
      await supabase.from('gallery_items').insert([{
        user_id:    userId,
        image_url:  publicUrl,
        media_type: isVideo ? 'video' : 'image',
        featured:   false,
      }]);
      done++;
      setProgress(Math.round((done / files.length) * 100));
    }
    await fetchGallery(userId);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function toggleFeatured(item: MediaItem) {
    await supabase.from('gallery_items').update({ featured: !item.featured }).eq('id', item.id);
    setGallery(g => g.map(i => i.id === item.id ? { ...i, featured: !i.featured } : i));
    if (lightbox?.id === item.id) setLightbox(p => p ? { ...p, featured: !p.featured } : null);
  }

  async function deleteItem(item: MediaItem) {
    if (!confirm('Delete this item from your lookbook?')) return;
    await supabase.from('gallery_items').delete().eq('id', item.id);
    setGallery(g => g.filter(i => i.id !== item.id));
    if (lightbox?.id === item.id) setLightbox(null);
  }

  async function saveCaption() {
    if (!editItem) return;
    await supabase.from('gallery_items').update({ caption }).eq('id', editItem.id);
    setGallery(g => g.map(i => i.id === editItem.id ? { ...i, caption } : i));
    setEditItem(null);
  }

  const filtered = gallery.filter(i => {
    if (tab === 'featured') return i.featured;
    if (tab === 'videos')   return i.media_type === 'video';
    return true;
  });

  const featuredCount = gallery.filter(i => i.featured).length;
  const videoCount    = gallery.filter(i => i.media_type === 'video').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lookbook</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {gallery.length} items · {featuredCount} featured · {videoCount} videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
              <Grid3X3 size={14} />
            </button>
            <button onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
              <LayoutList size={14} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
            className="hidden" onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60">
            {uploading
              ? <><Loader2 size={15} className="animate-spin" /> Uploading {progress}%</>
              : <><Plus size={15} /> Add Photos</>}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* SETUP HINT */}
      {!loading && gallery.length === 0 && !error && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold">Before uploading, make sure:</p>
            <ol className="mt-1 space-y-0.5 text-xs list-decimal list-inside text-blue-600">
              <li>You ran <code className="bg-blue-100 px-1 rounded">migration-v3.sql</code> in Supabase SQL Editor</li>
              <li>A <code className="bg-blue-100 px-1 rounded">business-assets</code> storage bucket exists with <strong>Public: ON</strong></li>
            </ol>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { id: 'all',      label: `All (${gallery.length})` },
          { id: 'featured', label: `Featured (${featuredCount})` },
          { id: 'videos',   label: `Videos (${videoCount})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div onClick={() => tab === 'all' && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center transition-all group ${tab === 'all' ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/20' : ''}`}>
          <div className="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
            <Camera size={28} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="text-gray-500 font-semibold text-sm">
            {tab === 'all' ? 'Upload your first photo or video' : `No ${tab} items yet`}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {tab === 'all' ? 'Click anywhere here or use Add Photos above' : 'Star items from the All tab to feature them'}
          </p>
          {tab === 'all' && (
            <div className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl">
              <Upload size={14} /> Upload Photos / Videos
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          <button onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
            <Plus size={20} className="text-gray-300 group-hover:text-blue-400 mb-1" />
            <span className="text-xs text-gray-300 group-hover:text-blue-400 font-semibold">Add More</span>
          </button>

          {filtered.map(item => (
            <div key={item.id}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer shadow-sm"
              onClick={() => setLightbox(item)}>
              {item.media_type === 'video'
                ? <video src={item.image_url} className="w-full h-full object-cover" />
                : <img src={item.image_url} alt={item.caption || ''} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-1 w-full">
                  <button onClick={e => { e.stopPropagation(); toggleFeatured(item); }}
                    className={`p-1.5 rounded-lg transition-colors ${item.featured ? 'bg-amber-400 text-white' : 'bg-white/80 text-gray-600 hover:bg-amber-400 hover:text-white'}`}>
                    <Star size={12} fill={item.featured ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setEditItem(item); setCaption(item.caption || ''); }}
                    className="p-1.5 bg-white/80 rounded-lg text-gray-600 hover:bg-white transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteItem(item); }}
                    className="p-1.5 bg-white/80 rounded-lg text-gray-600 hover:bg-red-500 hover:text-white transition-colors ml-auto">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {item.featured && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                  <Star size={10} className="text-white" fill="currentColor" />
                </div>
              )}
              {item.media_type === 'video' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <Film size={10} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
                onClick={() => setLightbox(item)}>
                {item.media_type === 'video'
                  ? <video src={item.image_url} className="w-full h-full object-cover" />
                  : <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.caption || (item.media_type === 'video' ? 'Video' : 'Photo')}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {item.media_type === 'video' && ' · Video'}
                  {item.featured && ' · ⭐ Featured'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFeatured(item)}
                  className={`p-2 rounded-xl transition-colors ${item.featured ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}>
                  <Star size={14} fill={item.featured ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => { setEditItem(item); setCaption(item.caption || ''); }}
                  className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deleteItem(item)}
                  className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
            {lightbox.media_type === 'video'
              ? <video src={lightbox.image_url} controls className="w-full max-h-[80vh] rounded-xl object-contain" />
              : <img src={lightbox.image_url} alt={lightbox.caption || ''} className="w-full max-h-[80vh] rounded-xl object-contain" />}
            {lightbox.caption && (
              <p className="text-white/70 text-sm text-center mt-3">{lightbox.caption}</p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => toggleFeatured(lightbox)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${lightbox.featured ? 'bg-amber-400 text-white' : 'bg-white/10 text-white hover:bg-amber-400'}`}>
                <Star size={14} fill={lightbox.featured ? 'currentColor' : 'none'} />
                {lightbox.featured ? 'Unfeature' : 'Feature'}
              </button>
              <button onClick={() => deleteItem(lightbox)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-red-500 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPTION EDITOR */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">Edit Caption</h3>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..." rows={3}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setEditItem(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button onClick={saveCaption}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}