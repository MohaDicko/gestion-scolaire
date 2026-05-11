'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, Send, Search, User, 
  MoreVertical, Paperclip, Smile, Phone, 
  Video, Info, Loader2, ChevronLeft 
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

interface Conversation {
  id: string;
  updatedAt: string;
  participants: any[];
  messages: any[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { firstName: string; lastName: string };
}

export default function ChatPage() {
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      toast.error('Erreur chargement discussions');
    } finally {
      setIsLoadingConv(false);
    }
  }, [toast]);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) setCurrentUser(JSON.parse(stored));
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (id: string) => {
    setIsLoadingMsgs(true);
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${id}`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      toast.error('Erreur chargement messages');
    } finally {
      setIsLoadingMsgs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      // Poll for new messages every 5s (Simple "Real-time" for now)
      const interval = setInterval(() => fetchMessages(activeConvId), 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId) return;

    const content = input.trim();
    setInput('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, content })
      });
      if (res.ok) fetchMessages(activeConvId);
    } catch (e) {
      toast.error('Erreur envoi');
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherParticipant = activeConv?.participants.find(p => p.id !== currentUser?.id);

  return (
    <AppLayout 
      title="Messagerie Interne" 
      subtitle="Communiquez en temps réel avec le staff et les parents"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Chat' }]}
    >
      <div className="card" style={{ 
        height: 'calc(100vh - 220px)', 
        padding: 0, 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr',
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid var(--border)'
      }}>
        
        {/* Sidebar: Conversations */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-2)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-3)', padding: '10px 15px', borderRadius: '12px' }}>
              <Search size={16} color="var(--text-dim)" />
              <input type="text" placeholder="Rechercher..." style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '14px' }} />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoadingConv ? (
              <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>
            ) : conversations.length > 0 ? (
              conversations.map(conv => {
                const partner = conv.participants.find(p => p.id !== currentUser?.id);
                const lastMsg = conv.messages[0];
                return (
                  <div 
                    key={conv.id} 
                    onClick={() => setActiveConvId(conv.id)}
                    style={{ 
                      padding: '16px 20px', 
                      cursor: 'pointer', 
                      background: activeConvId === conv.id ? 'var(--primary-dim)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)',
                      borderLeft: activeConvId === conv.id ? '4px solid var(--primary)' : '4px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--bg-4)', display: 'grid', placeItems: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                        {partner?.firstName[0]}{partner?.lastName[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>{partner?.firstName} {partner?.lastName}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lastMsg?.content || 'Nouvelle conversation'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: '13px' }}>Aucune discussion active</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white' }}>
          {activeConvId ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '15px 25px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                    {otherParticipant?.firstName[0]}{otherParticipant?.lastName[0]}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{otherParticipant?.firstName} {otherParticipant?.lastName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{otherParticipant?.role}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-dim)' }}>
                  <button className="btn-icon-chat"><Phone size={18} /></button>
                  <button className="btn-icon-chat"><Video size={18} /></button>
                  <button className="btn-icon-chat"><Info size={18} /></button>
                </div>
              </div>

              {/* Messages View */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px', background: '#f8fafc' }}>
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} style={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{ 
                        padding: '12px 18px', 
                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: isMe ? 'var(--primary)' : 'white',
                        color: isMe ? 'white' : 'var(--text)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        fontSize: '14px',
                        lineHeight: 1.5
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '20px 25px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f1f5f9', padding: '10px 15px', borderRadius: '15px' }}>
                  <button type="button" className="btn-icon-chat"><Smile size={20} /></button>
                  <button type="button" className="btn-icon-chat"><Paperclip size={20} /></button>
                  <input 
                    type="text" 
                    placeholder="Tapez votre message..." 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }}
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', 
                      background: 'var(--primary)', color: 'white', 
                      border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                      boxShadow: '0 4px 12px var(--primary-light)'
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '40px' }}>
              <div>
                <div style={{ width: '80px', height: '80px', borderRadius: '30px', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <MessageSquare size={40} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Sélectionnez une discussion</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '300px' }}>Choisissez un contact pour démarrer une conversation sécurisée.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .btn-icon-chat { background: none; border: none; color: inherit; cursor: pointer; padding: 5px; opacity: 0.6; transition: 0.2s; }
        .btn-icon-chat:hover { opacity: 1; color: var(--primary); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}
