import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {
    MessageCircle, X, Send, TrendingUp,
    TrendingDown, Minus, Mic, MicOff
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useLocation } from 'react-router-dom';

const fmt = (n) =>
    Number(n).toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

// ── SuggestionsChips ──────────────────────────────────────────────
// Sirf tab render hoti hain jab explicitly dikhani hon
// (failed queries, empty results, transaction success)
// Normal successful results pe nahi dikhatein
const SuggestionsChips = ({ suggestions, onSend }) => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((suggestion, i) => (
                <button
                    key={i}
                    onClick={() => onSend(suggestion)}
                    className="text-[11px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-full transition-all duration-150 cursor-pointer font-medium whitespace-nowrap"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};

// ── AccountNotFoundCard ───────────────────────────────────────────
const AccountNotFoundCard = ({ data, onSend }) => {
    const accountSuggestions = data.available_accounts
        ? data.available_accounts.map(a =>
            typeof a === 'string' ? a : a.name)
        : (data.suggestions || []);

    return (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                <span className="font-semibold text-amber-800">❓ Account Not Found</span>
            </div>
            <div className="px-4 pt-3 pb-2">
                <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{data.message}</ReactMarkdown>
                </div>
            </div>
            {accountSuggestions.length > 0 && (
                <div className="px-4 pb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Available Accounts:
                    </p>
                    <div className="space-y-1 max-h-[160px] overflow-y-auto">
                        {accountSuggestions.map((name, i) => (
                            <button
                                key={i}
                                onClick={() => onSend(`Show transactions for ${name}`)}
                                className="w-full text-left px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg text-xs text-gray-700 hover:text-blue-700 transition-all font-medium"
                            >
                                🏦 {typeof name === 'object' ? name.name : name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {data.hint && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-gray-400 italic">{data.hint}</p>
                </div>
            )}
        </div>
    );
};

// ── GeneralCard ───────────────────────────────────────────────────
const GeneralCard = ({ response }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-sm text-gray-700">
        <div className="prose prose-sm prose-blue max-w-none prose-p:leading-relaxed">
            <ReactMarkdown>{response}</ReactMarkdown>
        </div>
    </div>
);

// ── TransactionsCard ──────────────────────────────────────────────
// Columns: Date | #ID | Description | Amount
// Type column removed — Dr/Cr badge hataya gaya
// Description column add kiya gaya
const TransactionsCard = ({ data }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <span className="font-semibold text-blue-800">
                📋 {data.total_count} Transaction{data.total_count !== 1 ? 's' : ''}
            </span>
            <span className="text-blue-600 font-medium">
                PKR {fmt(data.total_sum)}
            </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
            <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-center">#ID</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.transactions.map((tx, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                                {tx.date}
                            </td>
                            <td className="px-3 py-2 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                                    #{tx.transaction_id}
                                </span>
                            </td>
                            <td className="px-3 py-2 text-gray-700 max-w-[130px] truncate">
                                {tx.description}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-800">
                                PKR {fmt(tx.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="px-4 py-2 text-right text-xs text-gray-400 border-t border-gray-50">
            {data.total_count} record{data.total_count !== 1 ? 's' : ''}
        </div>
    </div>
);

// ── AccountsCard ──────────────────────────────────────────────────
const AccountsCard = ({ data }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100">
            <span className="font-semibold text-purple-800">
                🏦 {data.total_count} Account{data.total_count !== 1 ? 's' : ''}
            </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
            <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Account</th>
                        <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {data.accounts.map((acc, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 text-gray-700">{acc.name}</td>
                            <td className={`px-3 py-2 text-right font-medium ${acc.balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                PKR {fmt(acc.balance)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="px-4 py-2 text-right text-xs text-gray-400 border-t border-gray-50">
            {data.total_count} record{data.total_count !== 1 ? 's' : ''}
        </div>
    </div>
);

// ── FinancialSummaryCard ──────────────────────────────────────────
const FinancialSummaryCard = ({ summary }) => {
    const isProfit = summary.profit >= 0;
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-sm">
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
                <span className="font-semibold text-emerald-800">
                    📊 Financial Summary — {summary.period}
                </span>
            </div>
            <table className="w-full text-xs">
                <tbody>
                    <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Total Income
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-600">
                            PKR {fmt(summary.income)}
                        </td>
                    </tr>
                    <tr className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-gray-500 flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Total Expense
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                            PKR {fmt(summary.expense)}
                        </td>
                    </tr>
                    <tr className="border-b border-gray-50 bg-gray-50">
                        <td className="px-4 py-2.5 font-semibold text-gray-700 flex items-center gap-1.5">
                            <Minus className="w-3.5 h-3.5 text-gray-400" />
                            {isProfit ? 'Net Profit' : 'Net Loss'}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : '-'} PKR {fmt(Math.abs(summary.profit))}
                        </td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2.5 text-gray-400 text-[11px]">Total Transactions</td>
                        <td className="px-4 py-2.5 text-right text-gray-500 font-medium">{summary.count}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// ── ConfirmTransactionCard ────────────────────────────────────────
const ConfirmTransactionCard = ({ data, onConfirm, onCancel }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
            <span className="font-semibold text-amber-800">📝 Confirm Transaction</span>
        </div>
        <div className="p-3 space-y-2">
            <div className="flex items-center justify-between bg-red-50 border-l-4 border-red-400 rounded-r-lg px-3 py-2">
                <div>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Debit</span>
                    <p className="text-gray-700 font-medium text-xs mt-0.5">{data.debit_account_name}</p>
                </div>
                <span className="text-red-600 font-bold text-sm">PKR {fmt(data.amount)}</span>
            </div>
            <div className="flex items-center justify-between bg-green-50 border-l-4 border-green-400 rounded-r-lg px-3 py-2">
                <div>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Credit</span>
                    <p className="text-gray-700 font-medium text-xs mt-0.5">{data.credit_account_name}</p>
                </div>
                <span className="text-green-600 font-bold text-sm">PKR {fmt(data.amount)}</span>
            </div>
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Description</span>
                <p className="text-gray-600 text-xs mt-0.5">{data.description}</p>
            </div>
        </div>
        <div className="flex gap-2 px-3 pb-3">
            <button onClick={onConfirm}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                ✅ Confirm
            </button>
            <button onClick={onCancel}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 rounded-lg border border-red-200 transition-colors">
                ❌ Cancel
            </button>
        </div>
    </div>
);

// ── TransactionSuccessCard ────────────────────────────────────────
const TransactionSuccessCard = ({ result }) => (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden text-sm">
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
            <span className="font-semibold text-emerald-700">✅ Transaction Posted</span>
        </div>
        <table className="w-full text-xs">
            <tbody>
                {[
                    ['Transaction ID', `#${result.frontend_transaction_id}`],
                    ['Date', result.date],
                    ['Amount', `PKR ${fmt(result.amount)}`],
                    ['Description', result.description],
                    ['Debit', result.debit_account_name],
                    ['Credit', result.credit_account_name],
                ].map(([label, value], i) => (
                    <tr key={i} className="border-t border-gray-50">
                        <td className="px-4 py-2 text-gray-400">{label}</td>
                        <td className="px-4 py-2 text-gray-700 font-medium text-right">{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ── MessageRenderer ───────────────────────────────────────────────
// showSuggestions flag check karta hai — sirf failed/empty/success
// pe chips dikhata hai, normal results pe nahi
const MessageRenderer = ({ msg, onConfirm, onCancel, onSend }) => {
    if (msg.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm text-sm">
                    {msg.content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start">
            <div className="max-w-[95%] w-full">
                {msg.type === 'financial_summary' && <FinancialSummaryCard summary={msg.data} />}
                {msg.type === 'transactions' && <TransactionsCard data={msg.data} />}
                {msg.type === 'accounts' && <AccountsCard data={msg.data} />}
                {msg.type === 'confirm_transaction' && (
                    <ConfirmTransactionCard
                        data={msg.data}
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                    />
                )}
                {msg.type === 'transaction_success' && <TransactionSuccessCard result={msg.data} />}
                {msg.type === 'account_not_found' && <AccountNotFoundCard data={msg.data} onSend={onSend} />}
                {(msg.type === 'general' || !msg.type) && <GeneralCard response={msg.content} />}

                {/* Suggestions — sirf jab showSuggestions === true ho
                    Confirm card pe kabhi nahi dikhate */}
                {msg.showSuggestions &&
                    msg.suggestions?.length > 0 &&
                    msg.type !== 'confirm_transaction' && (
                        <SuggestionsChips
                            suggestions={msg.suggestions}
                            onSend={onSend}
                        />
                    )}
            </div>
        </div>
    );
};

// ── FloatingChatbot — Main Component ─────────────────────────────
const FloatingChatbot = () => {
    const location = useLocation();
    const { selectedBusiness } = useBusiness();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
            let finalText = '', interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) finalText += t;
                else interimText += t;
            }
            setInput(finalText || interimText);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognitionRef.current = recognition;
        return () => recognition.abort();
    }, []);

    const handleVoiceToggle = () => {
        if (!recognitionRef.current) {
            alert('Voice input is not supported. Please use Chrome.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setInput('');
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const addMessage = (msgObject) => {
        setMessages(prev => [...prev, msgObject]);
    };

    // ── _handleResponse ───────────────────────────────────────────
    // showSuggestions flag server se aata hai — React khud decide
    // nahi karta ke suggestions dikhani hain ya nahi
    const _handleResponse = (data) => {
        const type = data.response_type;

        if (type === 'confirm_transaction') {
            setConfirmData(data.confirm_data);
            addMessage({
                role: 'ai',
                type: 'confirm_transaction',
                data: data.confirm_data,
                showSuggestions: false  // confirm card pe kabhi nahi
            });

        } else if (type === 'financial_summary') {
            addMessage({
                role: 'ai',
                type: 'financial_summary',
                data: data.summary,
                showSuggestions: false  // successful result
            });

        } else if (type === 'transactions') {
            addMessage({
                role: 'ai',
                type: 'transactions',
                data,
                showSuggestions: false  // successful result
            });

        } else if (type === 'accounts') {
            addMessage({
                role: 'ai',
                type: 'accounts',
                data,
                showSuggestions: false  // successful result
            });

        } else if (type === 'transaction_success') {
            addMessage({
                role: 'ai',
                type: 'transaction_success',
                data: data.result,
                // Success ke baad follow-up suggestions dikhao
                showSuggestions: data.showSuggestions || false,
                suggestions: data.suggestions || []
            });

        } else if (type === 'account_not_found') {
            addMessage({
                role: 'ai',
                type: 'account_not_found',
                data: data,
                showSuggestions: false  // card ke andar buttons hain
            });

        } else {
            // General / FAQ / error — server ka showSuggestions flag use karo
            addMessage({
                role: 'ai',
                type: 'general',
                content: data.response || "No response.",
                showSuggestions: data.showSuggestions || false,
                suggestions: data.suggestions || []
            });
        }
    };

    const sendQuery = async (queryText) => {
        if (!queryText?.trim() || isLoading) return;
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }
        addMessage({ role: 'user', content: queryText });
        setInput('');
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/ai/chat`,
                { user_query: queryText, business_id: selectedBusiness?.business_id },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            _handleResponse(response.data);
        } catch (error) {
            addMessage({
                role: 'ai', type: 'general',
                content: `**Error:** ${error.response?.data?.error || "Connection error."}`,
                showSuggestions: false
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        await sendQuery(input.trim());
    };

    const handleConfirm = async () => {
        setMessages(prev => prev.filter(m => m.type !== 'confirm_transaction'));
        setIsLoading(true);
        try {
            const result = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/ai/chat`,
                {
                    user_query: 'confirm',
                    business_id: selectedBusiness?.business_id,
                    confirm_transaction: confirmData
                },
                { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
            );
            _handleResponse(result.data);
        } catch {
            addMessage({
                role: 'ai', type: 'general',
                content: '**Error:** Could not confirm transaction.',
                showSuggestions: false
            });
        } finally {
            setConfirmData(null);
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setMessages(prev => prev.filter(m => m.type !== 'confirm_transaction'));
        setConfirmData(null);
        addMessage({
            role: 'ai', type: 'general',
            content: '❌ Transaction cancelled.',
            showSuggestions: false
        });
    };

    const hiddenRoutes = ['/', '/login', '/register', '/verify', '/forgot-password'];
    if (hiddenRoutes.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="w-screen h-[100dvh] rounded-none sm:w-[40vw] sm:h-[540px] sm:rounded-2xl sm:mb-4 bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="bg-[#050B14] text-white p-4 flex justify-between items-center shadow-md flex-shrink-0">
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
                            <h3 className="font-semibold text-lg tracking-wide">AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)}
                            className="text-gray-300 hover:text-white transition-colors p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Chat Body */}
                    <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                                <MessageCircle className="w-12 h-12 opacity-30" />
                                <p className="text-sm">How can I help you today?</p>
                                <SuggestionsChips
                                    suggestions={[
                                        'Show transactions',
                                        'Financial summary',
                                        'Show accounts',
                                        'What is trial balance'
                                    ]}
                                    onSend={sendQuery}
                                />
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <MessageRenderer
                                    key={index}
                                    msg={msg}
                                    onConfirm={handleConfirm}
                                    onCancel={handleCancel}
                                    onSend={sendQuery}
                                />
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                        {isListening && (
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                                </div>
                                <span className="text-xs text-red-500 font-medium">Listening... speak your query</span>
                            </div>
                        )}
                        <form onSubmit={handleSend} className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? '🎤 Listening...' : 'Ask me anything...'}
                                className={`flex-1 bg-gray-50 border text-gray-800 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 transition-all ${isListening ? 'border-red-300 focus:border-red-400 focus:ring-red-300' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'}`}
                                disabled={isLoading}
                            />
                            <button type="button" onClick={handleVoiceToggle} disabled={isLoading}
                                className={`p-2.5 rounded-full transition-all shadow-sm flex items-center justify-center flex-shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                            <button type="submit" disabled={!input.trim() || isLoading}
                                className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB */}
            {!isOpen && (
                <div className="mb-6 mr-6">
                    <button onClick={() => setIsOpen(true)}
                        className="bg-[#050B14] hover:bg-[#0a1220] transition-colors shadow-xl text-[#00E5FF] p-4 rounded-full flex items-center justify-center border border-[#00E5FF]/20 group relative">
                        <div className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-20"></div>
                        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FloatingChatbot;