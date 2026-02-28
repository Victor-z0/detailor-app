import { Suspense } from 'react';
import InviteContent from './InviteContent';
export const dynamic = 'force-dynamic';

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 selection:bg-black selection:text-white">
      <Suspense fallback={
        <div className="text-[10px] font-black uppercase tracking-widest animate-pulse text-gray-200">
          initializing_invite_sequence...
        </div>
      }>
        <InviteContent />
      </Suspense>
    </div>
  );
}