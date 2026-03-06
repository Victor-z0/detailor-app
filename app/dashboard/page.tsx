"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Calendar, DollarSign,
  ArrowUpRight, ArrowRight, Copy, CheckCheck,
  Car, ChevronRight, X, Phone, Navigation, CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const [businessName, setBusinessName] = useState('studio');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data: profile } = await supabase.from('profiles').select('business_name, role').eq('id', user.id).single();
      if (profile) setBusinessName(profile.business_name || 'studio');
      let query = supabase.from('appointments').select('*').order('scheduled_time', { ascending: true });
      if (profile?.role === 'staff') query = query.eq('staff_id', user.id);
      const { data: jobs } = await query;
      if (jobs) setAppointments(jobs);
      setLoading(false);
    }
    getData();
  }, [router]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
      setIsDrawerOpen(false);
    }
  };

  const copyBookingLink = () => {
    const slug = businessName.toLowerCase().replace(/ /g, '-');
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeJobs = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
  const completedJobs = appointments.filter(a => a.status === 'Completed');
  const revenue = completedJobs.reduce((acc, job) => acc + Number(job.total_price || 0), 0);
  const todayJobs = appointments.filter(a => new Date(a.scheduled_time).toDateString() === new Date().toDateString());

  // ✅ FIXED: no min-h-screen / bg-gray-50 so it stays inside DashboardShell
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">

      {/* WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good morning 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with <span className="font-semibold text-gray-700">{businessName}</span> today.</p>
        </div>
        <button
          onClick={copyBookingLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy Booking Link'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`$${revenue.toLocaleString()}`} change="+12%" positive icon={<DollarSign size={18} className="text-blue-600" />} bg="bg-blue-50" />
        <StatCard label="Active Jobs" value={activeJobs.length.toString()} change="This week" icon={<Car size={18} className="text-violet-600" />} bg="bg-violet-50" />
        <StatCard label="Today's Jobs" value={todayJobs.length.toString()} change="Scheduled" icon={<Calendar size={18} className="text-emerald-600" />} bg="bg-emerald-50" />
        <StatCard label="Completed" value={completedJobs.length.toString()} change="All time" icon={<CheckCircle2 size={18} className="text-orange-500" />} bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ACTIVE JOBS */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Active Jobs</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeJobs.length} jobs in progress</p>
            </div>
            <a href="/dashboard/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {activeJobs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">No active jobs</p>
                <p className="text-xs text-gray-300 mt-1">New appointments will appear here</p>
              </div>
            ) : (
              activeJobs.slice(0, 5).map((job) => (
                <button key={job.id} onClick={() => { setSelectedJob(job); setIsDrawerOpen(true); }}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {job.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{job.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{job.vehicle_info || job.vehicle_make_model || 'No vehicle info'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{new Date(job.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded-full">{job.status || 'Confirmed'}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-sm">
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Today</p>
            <p className="text-3xl font-bold">{todayJobs.length} <span className="text-blue-200 text-lg font-normal">jobs</span></p>
            <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs">Est. Revenue</p>
                <p className="text-white font-semibold text-sm mt-0.5">${todayJobs.reduce((a, j) => a + Number(j.total_price || 0), 0).toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-1">
              {[
                { label: 'View Calendar', href: '/dashboard/calendar' },
                { label: 'Manage Services', href: '/dashboard/services' },
                { label: 'Customer List', href: '/dashboard/customers' },
                { label: 'Analytics', href: '/dashboard/analytics' },
              ].map(link => (
                <a key={link.label} href={link.href} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="text-sm font-medium text-gray-700">{link.label}</span>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* JOB DETAIL DRAWER */}
      {isDrawerOpen && selectedJob && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedJob.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedJob.customer_name}</h3>
                  <p className="text-xs text-gray-400">{selectedJob.service_type || 'Detail Service'}</p>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${selectedJob.customer_phone}`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                  <Phone size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">Call Client</span>
                </a>
                <a href={`https://maps.apple.com/?q=${selectedJob.address}`} target="_blank" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                  <Navigation size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">Navigate</span>
                </a>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium mb-1">Vehicle</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedJob.vehicle_info || selectedJob.vehicle_make_model || 'Not specified'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium mb-1">Scheduled Time</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(selectedJob.scheduled_time).toLocaleString()}</p>
                </div>
                {selectedJob.address && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedJob.address}</p>
                  </div>
                )}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium mb-1">Price</p>
                  <p className="text-sm font-semibold text-gray-900">${selectedJob.total_price || '0'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button onClick={() => updateStatus(selectedJob.id, 'Completed')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                <CheckCircle2 size={16} /> Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, change, positive, icon, bg }: {
  label: string; value: string; change: string; positive?: boolean; icon: React.ReactNode; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
        {positive
          ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp size={10} /> {change}</span>
          : <span className="text-xs text-gray-400">{change}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}