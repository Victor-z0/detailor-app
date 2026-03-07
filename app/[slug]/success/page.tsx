"use client";

import React, { use } from "react";
import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SuccessPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="relative mb-12">
        <div className="w-20 h-20 border border-black rounded-full flex items-center justify-center shadow-xl">
          <Check size={32} strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2">
          <Zap size={20} className="fill-black text-black animate-pulse" />
        </div>
      </div>

      <h1 className="text-6xl font-black italic tracking-tightest lowercase mb-4">
        confirmed.
      </h1>
      
      <p className="text-gray-400 max-w-xs mb-16 font-medium italic leading-relaxed">
        Your deposit has been received. We&apos;ve added this to our schedule and will text you 24 hours before arrival.
      </p>

      <div className="flex flex-col gap-6 items-center">
        <Link 
          href={`/${slug}`} 
          className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-black pb-1 hover:opacity-50 transition-all flex items-center gap-2 group"
        >
          Return to base <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}