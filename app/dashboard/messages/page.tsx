"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Search, MessageSquare, Phone, Clock, Users, Plus, X, ChevronRight } from 'lucide-react';

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePanel, setActivePanel] = useState<'messages' | 'contacts'>('messages');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await Promise.all([fetchConversations(user.id), fetchContacts(user.id)]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedConvo || !userId) return;
    fetchMessages(selectedConvo.customer_phone);
    const channel = supabase.channel(`msgs-${selectedConvo.customer_phone}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages(selectedConvo.customer_phone);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversations(uid: string) {
    const { data } = await supabase.from('messages').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) {
      const grouped = data.reduce((acc: any, msg) => {
        if (!acc[msg.customer_phone]) acc[msg.customer_phone] = msg;
        return acc;
      }, {});
      setConversations(Object.values(grouped));
    }
  }

  async function fetchContacts(uid: string) {
    // Pull unique customers from appointments
    const { data } = await supabase.from('appointments').select('customer_name, customer_phone, customer_email').eq('user_id', uid).order('scheduled_time', { ascending: false });
    if (data) {
      const unique = data.reduce((acc: any[], cur) => {
        if (cur.customer_phone && !acc.find(c => c.customer_phone === cur.customer_phone)) acc.push(cur);
        return acc;
      }, []);
      setContacts(unique);
    }
  }

  async function fetchMessages(phone: string) {
    const { data } = await supabase.from('messages').select('*').eq('customer_phone', phone).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      await supabase.from('messages').update({ read: true }).eq('customer_phone', phone).eq('direction', 'inbound');
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConvo || !userId) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert([{
      user_id: userId,
      customer_phone: selectedConvo.customer_phone,
      customer_name: selectedConvo.customer_name,
      body: newMessage.trim(),
      direction: 'outbound',
      read: true,
    }]);
    if (!error) {
      setNewMessage('');
      await fetchMessages(selectedConvo.customer_phone);
      if (userId) fetchConversations(userId);
    }
    setSending(false);
  }

  function startConvo(contact: any) {
    setSelectedConvo(contact);
    setActivePanel('messages');
  }

  const filteredConvos = conversations.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm)
  );

  const filteredContacts = contacts.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm)
  );

  const unreadCount = conversations.filter(c => !c.read && c.direction === 'inbound').length;

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-400 mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '640px' }}>
        <div className="flex h-full">

          {/* LEFT SIDEBAR */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
            {/* TABS */}
            <div className="flex border-b border-gray-100">
              <button onClick={() => setActivePanel('messages')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activePanel === 'messages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <MessageSquare size={13} /> Messages {unreadCount > 0 && <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
              <button onClick={() => setActivePanel('contacts')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${activePanel === 'contacts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Users size={13} /> Contacts <span className="text-[9px] text-gray-400">{contacts.length}</span>
              </button>
            </div>

            {/* SEARCH */}
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                <input type="text" placeholder="Search..." value={searchTerm}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* MESSAGES LIST */}
            {activePanel === 'messages' && (
              <div className="flex-1 overflow-y-auto">
                {filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageSquare size={28} className="text-gray-200 mb-3" />
                    <p className="text-xs font-medium text-gray-400">No conversations yet</p>
                    <button onClick={() => setActivePanel('contacts')} className="mt-2 text-[11px] text-blue-600 font-semibold">Message a contact →</button>
                  </div>
                ) : filteredConvos.map(convo => {
                  const isSelected = selectedConvo?.customer_phone === convo.customer_phone;
                  const isUnread = !convo.read && convo.direction === 'inbound';
                  return (
                    <button key={convo.customer_phone} onClick={() => setSelectedConvo(convo)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}`}>
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">{initials(convo.customer_name)}</div>
                        {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{convo.customer_name}</p>
                          <p className="text-[9px] text-gray-300 flex-shrink-0 ml-2">{new Date(convo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>{convo.direction === 'outbound' ? 'You: ' : ''}{convo.body}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* CONTACTS LIST */}
            {activePanel === 'contacts' && (
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <Users size={28} className="text-gray-200 mb-3" />
                    <p className="text-xs font-medium text-gray-400">No contacts yet</p>
                    <p className="text-[10px] text-gray-300 mt-1">Contacts are pulled from your clients</p>
                  </div>
                ) : filteredContacts.map(contact => (
                  <button key={contact.customer_phone} onClick={() => startConvo(contact)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials(contact.customer_name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{contact.customer_name}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Phone size={9} />{contact.customer_phone}</p>
                    </div>
                    <ChevronRight size={13} className="text-gray-200 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MAIN CHAT */}
          <div className="flex-1 flex flex-col">
            {!selectedConvo ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-blue-300" />
                </div>
                <p className="text-base font-semibold text-gray-400">Select a conversation</p>
                <p className="text-sm text-gray-300 mt-1">or pick a contact to start messaging</p>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">{initials(selectedConvo.customer_name)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{selectedConvo.customer_name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{selectedConvo.customer_phone}</p>
                  </div>
                  <button onClick={() => setSelectedConvo(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={15} className="text-gray-400" /></button>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/40">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-300">No messages yet. Say hello!</p></div>
                  ) : messages.map(msg => {
                    const out = msg.direction === 'outbound';
                    return (
                      <div key={msg.id} className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-xs lg:max-w-md">
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${out ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'}`}>{msg.body}</div>
                          <p className={`text-[10px] text-gray-300 mt-1 flex items-center gap-1 ${out ? 'justify-end' : 'justify-start'}`}><Clock size={8} />{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* INPUT */}
                <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                    <Send size={15} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}