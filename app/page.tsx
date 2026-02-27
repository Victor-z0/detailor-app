import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-black px-6 text-center">
      <h1 className="text-5xl font-black tracking-tighter mb-4">Detailor</h1>
      <p className="text-gray-500 max-w-md mb-8">
        The all-in-one command center for your detailing business.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/signup" 
          className="bg-brand text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all"
        >
          Get Started
        </Link>
        <Link 
          href="/login" 
          className="bg-gray-100 text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}