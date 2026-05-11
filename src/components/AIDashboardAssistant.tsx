'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2, Maximize2, Minimize2, MessageSquare } from 'lucide-react';

export default function AIDashboardAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant IA SchoolERP. Posez-moi des questions sur vos élèves, vos finances ou le personnel.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer || "Je n'ai pas pu analyser ces données. Veuillez réessayer." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur technique m'empêche d'accéder aux données." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="ai-trigger-btn"
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '64px', height: '64px', borderRadius: '32px',
          background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
          display: 'grid', placeItems: 'center', zIndex: 1000,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <Sparkles size={28} className="sparkle-anim" />
      </button>
    );
  }

  return (
    <div 
      className="ai-chat-window animate-up"
      style={{
        position: 'fixed', bottom: '30px', right: '30px',
        width: isMinimized ? '300px' : '400px',
        height: isMinimized ? '60px' : '600px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        zIndex: 1000, overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
            <Bot size={18} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>IA Assistant</div>
            <div style={{ fontSize: '10px', opacity: 0.6 }}>En ligne • Analyse en temps réel</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-icon-ai" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button className="btn-icon-ai" onClick={() => setIsOpen(false)}><X size={16} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.role === 'user' ? 'var(--primary)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '13px',
                lineHeight: 1.5,
                boxShadow: msg.role === 'assistant' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
              }}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Loader2 size={16} className="spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '10px', background: 'white', padding: '8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <input 
                type="text" 
                placeholder="Ex: Qui sont les élèves en difficulté ?" 
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '5px 10px', fontSize: '13px' }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                style={{ 
                  width: '36px', height: '36px', borderRadius: '8px', 
                  background: 'var(--primary)', color: 'white', 
                  border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </>
      )}

      <style jsx>{`
        .ai-trigger-btn:hover { transform: scale(1.1); }
        .sparkle-anim { animation: sparkle 3s infinite; }
        @keyframes sparkle { 
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2) rotate(10deg); }
        }
        .btn-icon-ai { background: none; border: none; color: white; cursor: pointer; opacity: 0.6; padding: 4px; border-radius: 4px; transition: 0.2s; }
        .btn-icon-ai:hover { opacity: 1; background: rgba(255,255,255,0.1); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-up { animation: fadeUp 0.4s var(--ease) both; }
      `}</style>
    </div>
  );
}
