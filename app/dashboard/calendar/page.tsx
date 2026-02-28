"use client";
import Link from 'next/link';

export default function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] md:ml-64 p-8 flex flex-col items-center justify-center text-center">
      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm max-w-sm">
        <h1 className="text-2xl font-black mb-2 text-black">Under Construction</h1>
        <p className="text-gray-400 font-medium mb-6">We're building this feature to help you scale Detailor.</p>
        <Link href="/dashboard" className="bg-[#2563eb] text-white px-6 py-3 rounded-xl font-bold">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}