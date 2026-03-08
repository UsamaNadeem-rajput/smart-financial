import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { MessageCircle, X, Send } from 'lucide-react';

const FloatingChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            // Assuming credentials (cookie) are sent automatically by axios if we set withCredentials
            const response = await axios.post('/api/ai/chat', { user_query: userMessage }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true,
            });

            if (response.data && response.data.response) {
                setMessages(prev => [...prev, { role: 'ai', content: response.data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I received an empty response. Please try again." }]);
            }
        } catch (error) {
            console.error('Error in chat:', error);
            const errorMessage = error.response?.data?.error || "Error connecting to the AI brain.";
            setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="w-80 sm:w-96 h-[500px] mb-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 ease-in-out">
                    {/* Header */}
                    <div className="bg-[#050B14] text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
                            <h3 className="font-semibold text-lg tracking-wide">AI Assistant</h3>
                        </div>
                        <button
                            onClick={handleToggle}
                            className="text-gray-300 hover:text-white transition-colors p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                <MessageCircle className="w-12 h-12 opacity-50" />
                                <p className="text-sm">How can I help you today?</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                            }`}
                                    >
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <form onSubmit={handleSend} className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={handleToggle}
                    className="bg-[#050B14] hover:bg-[#0a1220] transition-colors shadow-xl text-[#00E5FF] p-4 rounded-full flex items-center justify-center border border-[#00E5FF]/20 group relative"
                >
                    <div className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-20"></div>
                    <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </button>
            )}
        </div>
    );
};

export default FloatingChatbot;
