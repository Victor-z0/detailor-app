import Link from 'next/link';
import { MoveLeft, Zap, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white">
      
      <div className="relative mb-12 animate-in fade-in zoom-in duration-700">
        <div className="absolute inset-0 rounded-full bg-gray-50 animate-ping opacity-20" />
        <div className="relative w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-black">
          <AlertTriangle size={32} strokeWidth={1.5} />
        </div>
      </div>

      <div className="text-center space-y-4 mb-16">
        <h1 className="text-[12rem] font-black italic tracking-tighter leading-none select-none opacity-5">404</h1>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-20">
          <h2 className="text-4xl font-black italic tracking-tightest lowercase leading-none">lost_in_the_void</h2>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] mt-4">The coordinate you requested does not exist.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs animate-in slide-in-from-bottom-8 duration-1000">
        <Link 
          href="/"
          className="group flex items-center justify-center gap-3 w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] active:scale-95 transition-all shadow-2xl"
        >
          <MoveLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          return_to_base
        </Link>
        
        <Link 
          href="/"
          className="w-full py-6 bg-gray-50 text-gray-400 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:text-black hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center"
        >
          home_terminal
        </Link>
      </div>

      <div className="fixed bottom-12 flex items-center gap-2 opacity-20">
        <Zap size={12} fill="black" />
        <span className="text-[8px] font-black uppercase tracking-widest">studio_os_v1.0</span>
      </div>
    </div>
  );
}