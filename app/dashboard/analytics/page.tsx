"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Target, Zap, BarChart3, PieChart, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, count: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/dashboard'); 
        return;
      }

      const { data: jobs } = await supabase
        .from('appointments')
        .select('total_price, scheduled_time, service_type')
        .eq('status', 'Completed')
        .order('scheduled_time', { ascending: true });

      if (jobs) {
        const total = jobs.reduce((sum, job) => sum + (Number(job.total_price) || 0), 0);
        setStats({
          total,
          count: jobs.length,
          avg: jobs.length > 0 ? Math.round(total / jobs.length) : 0
        });

        // Timeline: Aggregate by date
        const chartMap = jobs.reduce((acc: any, job) => {
          const date = new Date(job.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(job.total_price);
          return acc;
        }, {});

        const chartData = Object.keys(chartMap).map(date => ({
          date,
          revenue: chartMap[date]
        }));
        
        // Distribution: Count by service type
        const serviceMap = jobs.reduce((acc: any, job) => {
          const type = job.service_type || 'General';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const sData = Object.keys(serviceMap).map(name => ({
          name,
          value: serviceMap[name]
        })).sort((a, b) => b.value - a.value); // Sort by most popular

        setData(chartData);
        setServiceData(sData);
      }
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Activity className="text-black animate-spin mb-4" size={32} />
      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-200 italic">parsing_financial_nodes...</div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 max-w-[1600px] mx-auto pb-32 selection:bg-black selection:text-white bg-white">
      
      {/* HEADER */}
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 italic">intel_protocol</span>
          </div>
          <h1 className="text-6xl font-black italic tracking-tightest lowercase leading-none">insights.</h1>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-gray-50 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">export_csv</button>
           <button className="px-6 py-3 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">q1_report</button>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-12 bg-black text-white rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-72 group transition-all duration-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp size={120} />
          </div>
          <div className="flex items-center gap-3 opacity-40 uppercase text-[10px] font-black tracking-[0.3em] relative z-10">
            <DollarSign size={14} /> total_gross_yield
          </div>
          <h2 className="text-7xl font-black italic tracking-tighter tabular-nums relative z-10 leading-none">
            ${stats.total.toLocaleString()}
          </h2>
          <div className="flex items-center gap-4 relative z-10">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp size={12} className="text-blue-400" /> performance_optimized
            </p>
          </div>
        </div>

        <StatCard label="Ticket Avg" value={`$${stats.avg}`} sub="yield_per_session" icon={<Target size={20} />} />
        <StatCard label="Job Volume" value={stats.count.toString()} sub="completed_deployments" icon={<Zap size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* REVENUE VELOCITY */}
        <div className="lg:col-span-2 p-12 bg-white border border-gray-50 rounded-[4rem] h-[550px] flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-16">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 flex items-center gap-4">
              <BarChart3 size={18} className="text-black" /> Revenue_Velocity_Stream
            </h3>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-black" />
               <div className="w-2 h-2 rounded-full bg-gray-100" />
            </div>
          </div>
          
          <div className="flex-1 w-full -ml-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 900, fill: '#bbb'}} 
                  dy={20}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '2rem', 
                    border: 'none', 
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '20px',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)'
                  }}
                  itemStyle={{color: '#fff', fontSize: '12px', fontWeight: '900', textTransform: 'lowercase'}}
                  labelStyle={{display: 'none'}}
                  cursor={{stroke: '#000', strokeWidth: 1, strokeDasharray: '5 5'}}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="revenue" 
                  stroke="#000" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PACKAGE DISTRIBUTION */}
        <div className="p-12 bg-gray-50 border border-transparent rounded-[4rem] h-[550px] flex flex-col group hover:border-black transition-all duration-500">
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300 flex items-center gap-4 mb-16">
            <PieChart size={18} className="text-black" /> Service_Mix_Manifest
          </h3>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical" margin={{ left: -30 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: '#000'}}
                  width={120}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{borderRadius: '1.5rem', border: 'none', fontWeight: '900'}}
                />
                <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={28}>
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#000' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100 italic text-[10px] font-black uppercase tracking-widest text-center">
            Optimizing for {serviceData[0]?.name || '...'}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: any }) {
  return (
    <div className="p-12 border border-gray-50 rounded-[3.5rem] bg-white flex flex-col justify-between h-72 group hover:border-black transition-all duration-700 shadow-sm hover:shadow-xl">
      <div className="space-y-8">
        <div className="p-5 bg-gray-50 rounded-2xl w-fit text-gray-300 group-hover:bg-black group-hover:text-white transition-all duration-500">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-200 mb-3">{label}</p>
          <h4 className="text-6xl font-black italic tracking-tighter tabular-nums group-hover:scale-105 transition-transform origin-left leading-none">{value}</h4>
        </div>
      </div>
      <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.4em] italic">{sub}</p>
    </div>
  );
}