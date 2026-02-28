"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import NewAppointmentDrawer from '@/components/NewAppointmentDrawer';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_time', { ascending: false });
      if (data) setAppointments(data);
      setLoading(false);
    }
    fetchJobs();
  }, []);

  // COLOR CODING LOGIC
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in-progress':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default: // Upcoming
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading) return <div className="p-10 text-black font-bold text-center">Loading Jobs...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] md:ml-64 p-4 md:p-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-black">All Appointments</h1>
        <span className="text-sm font-bold text-gray-400">{appointments.length} Total</span>
      </div>

      <div className="grid gap-4">
        {appointments.map((job) => (
          <div key={job.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* LARGE STATUS DOT */}
              <div className={`w-3 h-3 rounded-full ${getStatusStyle(job.status).split(' ')[0]}`} />
              <div>
                <h3 className="font-bold text-gray-900">{job.customer_name}</h3>
                <p className="text-gray-500 text-xs font-medium">{job.vehicle_make_model} • {job.service_name}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(job.status)}`}>
                {job.status}
              </div>
              <p className="font-black text-black">${job.total_price}</p>
            </div>
          </div>
        ))}
      </div>

      <NewAppointmentDrawer />
    </div>
  );
}