"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Search, Filter, Download, Send, CheckCircle2,
  Clock, AlertCircle, DollarSign, FileText, Eye,
  MoreHorizontal, X, RefreshCw, ChevronDown, Trash2,
} from 'lucide-react';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface Invoice {
  id:           string;
  invoice_num:  string;
  client_name:  string;
  client_email: string;
  service:      string;
  amount:       number;
  deposit:      number;
  deposit_paid: boolean;
  status:       InvoiceStatus;
  due_date:     string;
  created_at:   string;
  notes:        string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft:     { label: 'Draft',     color: 'text-gray-500',   bg: 'bg-gray-100',    icon: FileText     },
  sent:      { label: 'Sent',      color: 'text-blue-600',   bg: 'bg-blue-50',     icon: Send         },
  paid:      { label: 'Paid',      color: 'text-emerald-600',bg: 'bg-emerald-50',  icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   color: 'text-red-600',    bg: 'bg-red-50',      icon: AlertCircle  },
  cancelled: { label: 'Cancelled', color: 'text-gray-400',   bg: 'bg-gray-50',     icon: X            },
};

const MOCK_INVOICES: Invoice[] = [
  { id:'1', invoice_num:'INV-001', client_name:'James Wilson',   client_email:'james@email.com', service:'Full Detail',       amount:180, deposit:50,  deposit_paid:true,  status:'paid',    due_date:'2026-03-01', created_at:'2026-02-20', notes:'' },
  { id:'2', invoice_num:'INV-002', client_name:'Maria Garcia',   client_email:'maria@email.com', service:'Ceramic Coating',   amount:850, deposit:200, deposit_paid:true,  status:'sent',    due_date:'2026-03-15', created_at:'2026-03-01', notes:'Full ceramic 2-year warranty' },
  { id:'3', invoice_num:'INV-003', client_name:'Tyler Brooks',   client_email:'tyler@email.com', service:'Paint Correction',  amount:420, deposit:100, deposit_paid:false, status:'overdue', due_date:'2026-02-28', created_at:'2026-02-10', notes:'' },
  { id:'4', invoice_num:'INV-004', client_name:'Ashley Chen',    client_email:'ash@email.com',   service:'Interior Detail',   amount:120, deposit:0,   deposit_paid:false, status:'draft',   due_date:'2026-03-20', created_at:'2026-03-05', notes:'' },
  { id:'5', invoice_num:'INV-005', client_name:'Marcus Johnson', client_email:'mj@email.com',    service:'PPF Hood Install',  amount:650, deposit:150, deposit_paid:true,  status:'paid',    due_date:'2026-03-10', created_at:'2026-03-02', notes:'' },
];

function NewInvoiceModal({ onClose, onSave }: { onClose: () => void; onSave: (inv: Partial<Invoice>) => void }) {
  const [form, setForm] = useState({
    client_name: '', client_email: '', service: '',
    amount: '', deposit: '', due_date: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">New Invoice</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Client Name</label>
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)}
                placeholder="James Wilson"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Client Email</label>
              <input value={form.client_email} onChange={e => set('client_email', e.target.value)}
                placeholder="client@email.com" type="email"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Service</label>
            <input value={form.service} onChange={e => set('service', e.target.value)}
              placeholder="Full Detail, Ceramic Coating, etc."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Total Amount ($)</label>
              <input value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="0.00" type="number" min="0"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Deposit ($)</label>
              <input value={form.deposit} onChange={e => set('deposit', e.target.value)}
                placeholder="0.00" type="number" min="0"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Due Date</label>
            <input value={form.due_date} onChange={e => set('due_date', e.target.value)}
              type="date"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} placeholder="Additional notes..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { onSave({ ...form, amount: Number(form.amount), deposit: Number(form.deposit) }); onClose(); }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2">
            <FileText size={14} /> Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices]   = useState<Invoice[]>(MOCK_INVOICES);
  const [search,   setSearch]     = useState('');
  const [filter,   setFilter]     = useState<InvoiceStatus | 'all'>('all');
  const [showNew,  setShowNew]    = useState(false);
  const [currency, setCurrency]   = useState('$');

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
                        inv.invoice_num.toLowerCase().includes(search.toLowerCase()) ||
                        inv.service.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending  = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0);
  const totalOverdue  = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const totalDraft    = invoices.filter(i => i.status === 'draft').length;

  function handleStatusChange(id: string, status: InvoiceStatus) {
    setInvoices(invs => invs.map(i => i.id === id ? { ...i, status } : i));
  }

  function handleNew(data: Partial<Invoice>) {
    const newInv: Invoice = {
      id:           Date.now().toString(),
      invoice_num:  `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      client_name:  data.client_name ?? '',
      client_email: data.client_email ?? '',
      service:      data.service ?? '',
      amount:       Number(data.amount) || 0,
      deposit:      Number(data.deposit) || 0,
      deposit_paid: false,
      status:       'draft',
      due_date:     data.due_date ?? '',
      created_at:   new Date().toISOString().slice(0, 10),
      notes:        data.notes ?? '',
    };
    setInvoices(invs => [newInv, ...invs]);
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create, send, and track invoices & deposits</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Collected',  value: `${currency}${totalRevenue.toLocaleString()}`, sub: 'paid invoices',   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending',    value: `${currency}${totalPending.toLocaleString()}`,  sub: 'awaiting payment', color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Overdue',    value: `${currency}${totalOverdue.toLocaleString()}`,  sub: 'past due date',    color: 'text-red-600',     bg: 'bg-red-50'     },
          { label: 'Drafts',     value: totalDraft.toString(),                          sub: 'not sent yet',     color: 'text-gray-600',    bg: 'bg-gray-100'   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${s.bg}`}>
              <DollarSign size={16} className={s.color} />
            </div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices, clients, services..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
              {f === 'all' ? 'All Invoices' : f}
            </button>
          ))}
        </div>
      </div>

      {/* INVOICE LIST */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Table header - desktop */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_100px_100px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
          {['Invoice', 'Client', 'Service', 'Amount', 'Due Date', 'Status'].map(h => (
            <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <FileText size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">No invoices found</p>
            <p className="text-sm text-gray-300 mt-1">Create your first invoice to get started</p>
          </div>
        )}

        {filtered.map((inv, i) => {
          const s = STATUS_CONFIG[inv.status];
          const Icon = s.icon;
          return (
            <div key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              {/* Mobile card */}
              <div className="sm:hidden px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={13} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">{inv.invoice_num} · {inv.client_name}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${s.bg} ${s.color}`}>
                      <Icon size={9} /> {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{inv.service}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-sm font-bold text-gray-900">{currency}{inv.amount}</p>
                    {inv.deposit > 0 && (
                      <p className={`text-xs ${inv.deposit_paid ? 'text-emerald-500' : 'text-amber-500'}`}>
                        Dep: {currency}{inv.deposit} {inv.deposit_paid ? '✓' : ''}
                      </p>
                    )}
                    {inv.due_date && <p className="text-xs text-gray-400 ml-auto">Due {inv.due_date}</p>}
                  </div>
                </div>
                <div className="relative group flex-shrink-0">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><MoreHorizontal size={14} /></button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 w-36 hidden group-hover:block">
                    {inv.status === 'draft' && <button onClick={() => handleStatusChange(inv.id, 'sent')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Send size={12} /> Send Invoice</button>}
                    {inv.status === 'sent'  && <button onClick={() => handleStatusChange(inv.id, 'paid')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={12} /> Mark Paid</button>}
                    <button onClick={() => handleStatusChange(inv.id, 'cancelled')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"><Trash2 size={12} /> Cancel</button>
                  </div>
                </div>
              </div>
              {/* Desktop row */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_100px_100px_120px] gap-4 px-5 py-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><FileText size={13} className="text-blue-500" /></div>
                  <div><p className="text-sm font-bold text-gray-900">{inv.invoice_num}</p><p className="text-xs text-gray-400">{inv.created_at}</p></div>
                </div>
                <div><p className="text-sm font-semibold text-gray-700">{inv.client_name}</p><p className="text-xs text-gray-400">{inv.client_email}</p></div>
                <p className="text-sm text-gray-600">{inv.service}</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{currency}{inv.amount}</p>
                  {inv.deposit > 0 && <p className={`text-xs ${inv.deposit_paid ? 'text-emerald-500' : 'text-amber-500'}`}>Dep: {currency}{inv.deposit} {inv.deposit_paid ? '✓' : ''}</p>}
                </div>
                <p className="text-sm text-gray-500">{inv.due_date || '—'}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.color}`}><Icon size={10} /> {s.label}</span>
                  <div className="relative group ml-auto">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><MoreHorizontal size={14} /></button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 w-36 hidden group-hover:block">
                      {inv.status === 'draft' && <button onClick={() => handleStatusChange(inv.id, 'sent')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Send size={12} /> Send Invoice</button>}
                      {inv.status === 'sent'  && <button onClick={() => handleStatusChange(inv.id, 'paid')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={12} /> Mark Paid</button>}
                      <button onClick={() => handleStatusChange(inv.id, 'cancelled')} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"><Trash2 size={12} /> Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNew && <NewInvoiceModal onClose={() => setShowNew(false)} onSave={handleNew} />}
    </div>
  );
}