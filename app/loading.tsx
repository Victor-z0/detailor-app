import { Zap } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Central Icon */}
        <Zap 
          size={48} 
          className="text-black animate-pulse" 
          strokeWidth={1.5} 
        />
        
        {/* Circular Scanner Effect */}
        <div className="absolute inset-0 border-2 border-black/5 rounded-full scale-[2.5] animate-ping" />
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-black animate-pulse">
          studio_os_initializing
        </h2>
        <div className="mt-4 flex gap-1 justify-center">
          <div className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-black rounded-full animate-bounce" />
        </div>
      </div>

      {/* Identity Footer */}
      <div className="absolute bottom-12 flex items-center gap-2 opacity-10">
        <span className="text-[8px] font-black uppercase tracking-widest">protocol_v1.0.4</span>
      </div>
    </div>
  );
}