import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, ChevronRight } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface Message {
    id: string;
    text: string;
    sender: 'ai' | 'user';
    timestamp: Date;
    actionType?: string;
}

export function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Bonjour ! Je suis votre assistant SchoolERP. Comment puis-je vous aider aujourd'hui ?",
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await apiClient.post('/ai/ask', { prompt: input });

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.data.message,
                sender: 'ai',
                timestamp: new Date(),
                actionType: response.data.actionType,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    text: "Désolé, j'ai rencontré une erreur lors de la connexion au serveur.",
                    sender: 'ai',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="ai-toggle-btn"
                title="Assistant IA"
            >
                <Sparkles size={24} />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <div className="ai-header-left">
                            <div className="ai-bot-avatar">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="ai-header-title">Assistant SchoolERP</p>
                                <p className="ai-header-status">
                                    {loading ? 'Réflexion...' : 'En ligne'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="ai-close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="ai-messages-container">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                                <div className="ai-message-content">
                                    <div className="ai-message-bubble">
                                        {msg.text}
                                        {msg.actionType && (
                                            <div className="ai-action-suggestion">
                                                <ChevronRight size={14} />
                                                <span>Suggestion d'action : {msg.actionType}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="ai-message-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-message-row ai">
                                <div className="ai-message-content">
                                    <div className="ai-message-bubble loading">
                                        <div className="typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="ai-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez une question à l'IA..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={!input.trim() || loading} className="ai-send-btn">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
