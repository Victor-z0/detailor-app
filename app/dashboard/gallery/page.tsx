"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Maximize2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    setItems(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-20">
      
      {/* MINIMALIST HEADER */}
      <nav className="p-8 flex justify-between items-center max-w-7xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="p-4 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-right">
          <h1 className="text-4xl font-black italic tracking-tighter lowercase leading-none">the_lookbook</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mt-1">proven_results</p>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8">
        {loading ? (
          <div className="py-40 text-center">
            <Zap className="animate-pulse mx-auto text-gray-100" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className="group relative overflow-hidden rounded-[3rem] bg-gray-50 aspect-[4/5] animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image with subtle zoom on hover */}
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                {/* High-Contrast Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-10">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white text-black px-3 py-1.5 rounded-full mb-4 inline-block">
                      {item.car_model || 'Premium Detail'}
                    </span>
                    <h3 className="text-white text-3xl font-black italic lowercase leading-none">{item.title}</h3>
                    <div className="h-1 w-12 bg-white/20 mt-4 rounded-full" />
                  </div>
                </div>

                {/* Mobile Tap Indicator */}
                <div className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
                  <Maximize2 size={16} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && items.length === 0 && (
          <div className="py-40 text-center border-2 border-dashed border-gray-50 rounded-[4rem]">
            <p className="text-gray-300 font-black italic lowercase text-xl tracking-tighter">no_work_uploaded_yet</p>
          </div>
        )}
      </main>

      {/* FOOTER CALL TO ACTION */}
      <footer className="mt-20 p-12 text-center bg-gray-50/50 mx-8 rounded-[4rem]">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-8">ready_for_transformation?</p>
        <button 
          onClick={() => router.push('/book')}
          className="px-12 py-8 bg-black text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:shadow-black/20 active:scale-95 transition-all"
        >
          secure_your_slot
        </button>
      </footer>
    </div>
  );
}