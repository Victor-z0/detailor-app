"use client";
import { useState } from 'react';
import {
  Plus, Play, Pause, Clock, Mail, MessageSquare,
  Zap, ChevronRight, X, Check, ArrowDown,
  GitBranch, Filter, User, Star, DollarSign,
  Calendar, MoreHorizontal, Copy, Trash2, Edit3,
} from 'lucide-react';

type TriggerType = 'booking_confirmed' | 'job_completed' | 'invoice_sent' | 'new_lead' | 'no_show' | 'custom_date';
type ActionType  = 'send_sms' | 'send_email' | 'wait' | 'add_tag' | 'update_status' | 'notify_me';
type WFStatus    = 'active' | 'paused' | 'draft';

interface WorkflowStep {
  id:      string;
  type:    'trigger' | 'action' | 'condition';
  action:  TriggerType | ActionType | string;
  config:  Record<string, string>;
}

interface Workflow {
  id:        string;
  name:      string;
  desc:      string;
  status:    WFStatus;
  steps:     WorkflowStep[];
  runs:      number;
  lastRun:   string;
  category:  string;
}

const TRIGGER_OPTIONS: { value: TriggerType; label: string; icon: any; color: string }[] = [
  { value: 'booking_confirmed', label: 'Booking Confirmed',  icon: Calendar,      color: 'text-blue-600'    },
  { value: 'job_completed',     label: 'Job Completed',      icon: Check,         color: 'text-emerald-600' },
  { value: 'invoice_sent',      label: 'Invoice Sent',       icon: DollarSign,    color: 'text-violet-600'  },
  { value: 'new_lead',          label: 'New Lead',           icon: User,          color: 'text-amber-600'   },
  { value: 'no_show',           label: 'Client No-Show',     icon: X,             color: 'text-red-600'     },
  { value: 'custom_date',       label: 'Scheduled Date',     icon: Clock,         color: 'text-cyan-600'    },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: any; color: string }[] = [
  { value: 'send_sms',      label: 'Send SMS',         icon: MessageSquare, color: 'text-blue-600'    },
  { value: 'send_email',    label: 'Send Email',       icon: Mail,          color: 'text-violet-600'  },
  { value: 'wait',          label: 'Wait / Delay',     icon: Clock,         color: 'text-gray-500'    },
  { value: 'add_tag',       label: 'Tag Client',       icon: Filter,        color: 'text-amber-600'   },
  { value: 'update_status', label: 'Update Status',    icon: GitBranch,     color: 'text-cyan-600'    },
  { value: 'notify_me',     label: 'Notify Me',        icon: Zap,           color: 'text-emerald-600' },
];

const PRESET_WORKFLOWS: Workflow[] = [
  {
    id: '1',
    name: 'New Booking Confirmation',
    desc: 'Instantly confirm bookings and send prep instructions to clients',
    status: 'active',
    runs: 47,
    lastRun: '2 hours ago',
    category: 'Bookings',
    steps: [
      { id: 't1', type: 'trigger', action: 'booking_confirmed', config: {} },
      { id: 'a1', type: 'action',  action: 'send_sms',   config: { message: 'Hi {name}! Your detail is confirmed for {date} at {time}. See you then! 🚗' } },
      { id: 'a2', type: 'action',  action: 'wait',       config: { duration: '24 hours' } },
      { id: 'a3', type: 'action',  action: 'send_sms',   config: { message: 'Reminder: Your detail is tomorrow at {time}. Please ensure your car is accessible.' } },
    ],
  },
  {
    id: '2',
    name: 'After Service Follow-Up',
    desc: 'Thank the client and request a Google review after job completion',
    status: 'active',
    runs: 82,
    lastRun: '4 hours ago',
    category: 'Reviews',
    steps: [
      { id: 't1', type: 'trigger', action: 'job_completed',  config: {} },
      { id: 'a1', type: 'action',  action: 'wait',           config: { duration: '2 hours' } },
      { id: 'a2', type: 'action',  action: 'send_sms',       config: { message: 'Thanks {name}! Hope you love the results. Mind leaving us a quick Google review? {link}' } },
    ],
  },
  {
    id: '3',
    name: 'No-Show Recovery',
    desc: 'Re-engage clients who missed their appointment',
    status: 'draft',
    runs: 0,
    lastRun: 'Never',
    category: 'Recovery',
    steps: [
      { id: 't1', type: 'trigger', action: 'no_show',   config: {} },
      { id: 'a1', type: 'action',  action: 'wait',      config: { duration: '1 hour' } },
      { id: 'a2', type: 'action',  action: 'send_sms',  config: { message: 'Hey {name}, we missed you today! Would you like to reschedule? Book here: {link}' } },
      { id: 'a3', type: 'action',  action: 'add_tag',   config: { tag: 'no-show' } },
    ],
  },
  {
    id: '4',
    name: 'Invoice Payment Reminder',
    desc: 'Automatically follow up on unpaid invoices',
    status: 'paused',
    runs: 12,
    lastRun: '3 days ago',
    category: 'Payments',
    steps: [
      { id: 't1', type: 'trigger', action: 'invoice_sent', config: {} },
      { id: 'a1', type: 'action',  action: 'wait',         config: { duration: '3 days' } },
      { id: 'a2', type: 'action',  action: 'send_sms',     config: { message: 'Hi {name}, just a reminder your invoice for {service} is due. Pay here: {link}' } },
      { id: 'a3', type: 'action',  action: 'wait',         config: { duration: '7 days' } },
      { id: 'a4', type: 'action',  action: 'notify_me',    config: { message: 'Invoice still unpaid after 10 days for {name}' } },
    ],
  },
];

function StepBadge({ step }: { step: WorkflowStep }) {
  const triggerOpt = TRIGGER_OPTIONS.find(t => t.value === step.action);
  const actionOpt  = ACTION_OPTIONS.find(a  => a.value  === step.action);
  const opt = triggerOpt ?? actionOpt;
  if (!opt) return null;
  const Icon = opt.icon;

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
        step.type === 'trigger' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-700'
      }`}>
        <Icon size={12} className={opt.color} />
        <span>{opt.label}</span>
        {step.config.duration && <span className="text-gray-400">· {step.config.duration}</span>}
      </div>
      {step.type !== 'trigger' && <ArrowDown size={12} className="text-gray-300 my-1" />}
    </div>
  );
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(PRESET_WORKFLOWS);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [category,  setCategory]  = useState('All');

  const categories = ['All', ...Array.from(new Set(workflows.map(w => w.category)))];
  const filtered   = category === 'All' ? workflows : workflows.filter(w => w.category === category);
  const selectedWF = workflows.find(w => w.id === selected);

  function toggleWorkflow(id: string) {
    setWorkflows(all => all.map(w => {
      if (w.id !== id) return w;
      return { ...w, status: w.status === 'active' ? 'paused' : 'active' };
    }));
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-400 mt-0.5">Build custom automation sequences for your business</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Plus size={15} /> New Workflow
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active',    value: workflows.filter(w => w.status === 'active').toString().includes(',') ? workflows.filter(w => w.status === 'active').length.toString() : workflows.filter(w => w.status === 'active').length.toString(), color: 'text-emerald-600' },
          { label: 'Total Runs', value: workflows.reduce((s,w) => s + w.runs, 0).toString(), color: 'text-blue-600' },
          { label: 'Paused',    value: workflows.filter(w => w.status === 'paused').length.toString(), color: 'text-amber-600' },
          { label: 'Drafts',    value: workflows.filter(w => w.status === 'draft').length.toString(), color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${category === c ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className={`grid gap-5 ${selected ? 'grid-cols-1 lg:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>

        {/* WORKFLOW LIST */}
        <div className="space-y-3">
          {filtered.map(wf => (
            <div key={wf.id}
              className={`bg-white border rounded-2xl shadow-sm transition-all cursor-pointer ${selected === wf.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'}`}
              onClick={() => setSelected(selected === wf.id ? null : wf.id)}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-gray-900">{wf.name}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        wf.status === 'active'  ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' :
                        wf.status === 'paused'  ? 'text-amber-600 bg-amber-50 border border-amber-100' :
                        'text-gray-400 bg-gray-50 border border-gray-100'
                      }`}>{wf.status}</span>
                      <span className="text-[9px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">{wf.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">{wf.desc}</p>

                    {/* Step preview */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {wf.steps.map((step, i) => {
                        const tOpt = TRIGGER_OPTIONS.find(t => t.value === step.action);
                        const aOpt = ACTION_OPTIONS.find(a  => a.value === step.action);
                        const opt  = tOpt ?? aOpt;
                        if (!opt) return null;
                        const Icon = opt.icon;
                        return (
                          <div key={step.id} className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                              step.type === 'trigger' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'
                            }`}>
                              <Icon size={9} />
                              <span>{opt.label}</span>
                            </div>
                            {i < wf.steps.length - 1 && <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); toggleWorkflow(wf.id); }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${wf.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wf.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-700">{wf.runs} runs</p>
                      <p className="text-[10px] text-gray-400">{wf.lastRun}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* WORKFLOW DETAIL PANEL */}
        {selectedWF && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-gray-900">{selectedWF.name}</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={14} />
              </button>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sequence</p>
            <div className="space-y-1">
              {selectedWF.steps.map((step, i) => {
                const tOpt = TRIGGER_OPTIONS.find(t => t.value === step.action);
                const aOpt = ACTION_OPTIONS.find(a  => a.value === step.action);
                const opt  = tOpt ?? aOpt;
                if (!opt) return null;
                const Icon = opt.icon;
                return (
                  <div key={step.id} className="flex flex-col items-start">
                    <div className={`w-full flex items-start gap-3 p-3 rounded-xl ${step.type === 'trigger' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${step.type === 'trigger' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Icon size={13} className={opt.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700">{opt.label}</p>
                        {step.config.message && <p className="text-[10px] text-gray-400 mt-0.5 truncate">"{step.config.message.slice(0, 50)}..."</p>}
                        {step.config.duration && <p className="text-[10px] text-gray-400 mt-0.5">Delay: {step.config.duration}</p>}
                        {step.config.tag && <p className="text-[10px] text-gray-400 mt-0.5">Tag: {step.config.tag}</p>}
                      </div>
                      <span className="text-[9px] font-black text-gray-300">#{i+1}</span>
                    </div>
                    {i < selectedWF.steps.length - 1 && (
                      <div className="ml-3.5 w-px h-3 bg-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                <Edit3 size={12} /> Edit
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <Copy size={12} /> Duplicate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="mt-8 p-5 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <GitBranch size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-900 mb-1">Visual Workflow Builder Coming Soon</p>
            <p className="text-xs text-violet-600 leading-relaxed">
              A drag-and-drop builder to create custom workflows with branching logic, conditions, and multi-channel sequences. For now, customize presets above or contact support to set up a custom workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}