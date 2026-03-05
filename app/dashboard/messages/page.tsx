"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Search, MessageSquare, Phone, Clock } from 'lucide-react';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchConversations(user.id);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedConvo) return;
    fetchMessages(selectedConvo.customer_phone);

    // Realtime subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchMessages(selectedConvo.customer_phone);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchConversations(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (data) {
      // Group by customer_phone, keep latest message per convo
      const grouped = data.reduce((acc: any, msg) => {
        if (!acc[msg.customer_phone]) acc[msg.customer_phone] = msg;
        return acc;
      }, {});
      setConversations(Object.values(grouped));
    }
  }

  async function fetchMessages(phone: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Mark as read
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
      read: true
    }]);

    if (!error) {
      setNewMessage('');
      await fetchMessages(selectedConvo.customer_phone);
      await fetchConversations(userId);
    }
    setSending(false);
  }

  async function startNewConvo(customerPhone: string, customerName: string) {
    if (!userId) return;
    setSelectedConvo({ customer_phone: customerPhone, customer_name: customerName });
  }

  // Load customers for new conversation
  const [customers, setCustomers] = useState<any[]>([]);
  const [showNewConvo, setShowNewConvo] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      const { data } = await supabase.from('appointments').select('customer_name, customer_phone').order('scheduled_time', { ascending: false });
      if (data) {
        const unique = data.reduce((acc: any[], cur) => {
          if (!acc.find(c => c.customer_phone === cur.customer_phone)) acc.push(cur);
          return acc;
        }, []);
        setCustomers(unique);
      }
    }
    loadCustomers();
  }, []);

  const filteredConvos = conversations.filter(c =>
    c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone?.includes(searchTerm)
  );

  const unreadCount = conversations.filter(c => !c.read && c.direction === 'inbound').length;

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
          <p className="text-sm text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up'}
          </p>
        </div>
        <button
          onClick={() => setShowNewConvo(!showNewConvo)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <MessageSquare size={15} /> New Message
        </button>
      </div>

      {/* NEW CONVO PICKER */}
      {showNewConvo && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select a client to message</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {customers.map(c => (
              <button
                key={c.customer_phone}
                onClick={() => { startNewConvo(c.customer_phone, c.customer_name); setShowNewConvo(false); }}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.customer_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{c.customer_name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.customer_phone}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">

          {/* SIDEBAR - Conversations List */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="p-3 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageSquare size={28} className="text-gray-200 mb-3" />
                  <p className="text-xs font-medium text-gray-400">No conversations yet</p>
                  <p className="text-[10px] text-gray-300 mt-1">Start a new message above</p>
                </div>
              ) : (
                filteredConvos.map((convo) => {
                  const isSelected = selectedConvo?.customer_phone === convo.customer_phone;
                  const isUnread = !convo.read && convo.direction === 'inbound';
                  return (
                    <button
                      key={convo.customer_phone}
                      onClick={() => setSelectedConvo(convo)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {convo.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        {isUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                            {convo.customer_name}
                          </p>
                          <p className="text-[9px] text-gray-300 flex-shrink-0 ml-2">
                            {new Date(convo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>
                          {convo.direction === 'outbound' ? 'You: ' : ''}{convo.body}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* MAIN - Chat Area */}
          <div className="flex-1 flex flex-col">
            {!selectedConvo ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-blue-300" />
                </div>
                <p className="text-base font-semibold text-gray-400">Select a conversation</p>
                <p className="text-sm text-gray-300 mt-1">or start a new message</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedConvo.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedConvo.customer_name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {selectedConvo.customer_phone}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/30">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-300">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOutbound = msg.direction === 'outbound';
                      return (
                        <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md ${isOutbound ? 'order-2' : 'order-1'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOutbound ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'}`}>
                              {msg.body}
                            </div>
                            <p className={`text-[10px] text-gray-300 mt-1 flex items-center gap-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                              <Clock size={8} />
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
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