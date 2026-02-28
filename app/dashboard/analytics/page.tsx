"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Target, Zap, BarChart3, PieChart } from 'lucide-react';

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

        // Chart 1: Revenue Timeline
        const chartMap = jobs.reduce((acc: any, job) => {
          const date = new Date(job.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + Number(job.total_price);
          return acc;
        }, {});

        const chartData = Object.keys(chartMap).map(date => ({
          date,
          revenue: chartMap[date]
        }));
        
        // Chart 2: Service Popularity
        const serviceMap = jobs.reduce((acc: any, job) => {
          const type = job.service_type || 'General';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        const sData = Object.keys(serviceMap).map(name => ({
          name,
          value: serviceMap[name]
        }));

        setData(chartData);
        setServiceData(sData);
      }
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [router]);

  if (loading) return <div className="p-10 text-center mt-20 lowercase italic font-medium">calculating_metrics...</div>;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32 selection:bg-black selection:text-white">
      
      {/* HEADER */}
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic tracking-tightest lowercase animate-in fade-in slide-in-from-left duration-700">insights</h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Revenue & Performance Metrics</span>
            <div className="h-px w-12 bg-gray-100" />
          </div>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-10 bg-black text-white rounded-[3rem] shadow-2xl shadow-black/20 flex flex-col justify-between h-64 group hover:scale-[1.02] transition-transform duration-500">
          <div className="flex items-center gap-3 opacity-40 uppercase text-[10px] font-black tracking-widest">
            <DollarSign size={14} /> Total Earnings
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter tabular-nums">${stats.total.toLocaleString()}</h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={12} className="text-green-400" /> +12.5% from last month
          </p>
        </div>

        <StatCard label="Average Ticket" value={`$${stats.avg}`} sub="revenue_per_detail" icon={<Target size={18} />} />
        <StatCard label="Job Volume" value={stats.count.toString()} sub="completed_appointments" icon={<Zap size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GROWTH CHART */}
        <div className="lg:col-span-2 p-10 bg-white border border-gray-100 rounded-[3rem] h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-3">
              <BarChart3 size={16} className="text-black" /> Revenue_Velocity
            </h3>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: '#ccc'}} 
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 'bold'}}
                  cursor={{stroke: '#000', strokeWidth: 1}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#000" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SERVICE MIX */}
        <div className="p-10 bg-gray-50/50 border border-gray-50 rounded-[3rem] h-[500px] flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-3 mb-12">
            <PieChart size={16} className="text-black" /> Service_Distribution
          </h3>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 900, fill: '#000'}}
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={32}>
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#000' : '#e5e5e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-8 text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center italic">top_performing_packages</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: any }) {
  return (
    <div className="p-10 border border-gray-100 rounded-[3rem] bg-white flex flex-col justify-between h-64 group hover:border-black transition-all duration-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-2">{label}</p>
          <h4 className="text-5xl font-black italic tracking-tighter tabular-nums group-hover:scale-110 transition-transform origin-left">{value}</h4>
        </div>
      </div>
      <p className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.2em]">{sub}</p>
    </div>
  );
}