import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Modal, Table } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, History, Building2, Wallet, FileText, ChevronRight, Shield, Key } from 'lucide-react';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState('businesses');
    const navigate = useNavigate();

    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${apiUrl}/api/profile`, { withCredentials: true });
            setProfile(res.data);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                navigate('/login');
            } else {
                setError('Failed to load profile.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/history`, { withCredentials: true });
            setHistory(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            setError('Failed to load history.');
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner animation="border" role="status" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <Alert variant="danger" className="max-w-2xl mx-auto shadow-md rounded-lg">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-primary-50 via-white to-primary-50 py-10 px-4 sm:px-6 lg:px-8">
            <motion.div
                className="max-w-3xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h2>
                    <p className="text-gray-500">Manage your personal information and check deleted records.</p>
                </motion.div>

                {profile && (
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8 relative">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-transparent rounded-bl-full opacity-30 pointer-events-none"></div>

                        <div className="p-8 relative z-10 font-sans">
                            {/* Header Section */}
                            <div className="flex items-center justify-between pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden relative">
                                        <span className="text-3xl text-gray-600 font-medium">{profile.full_name?.charAt(0).toUpperCase()}</span>
                                        {/* Little edit icon placeholder as seen in image */}
                                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200">
                                            <User className="w-3 h-3 text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-gray-800">{profile.full_name}</h3>
                                        <p className="text-gray-500 text-base">{profile.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="flex flex-col">
                                {/* Name Row */}
                                <div className="flex justify-between items-center py-5 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">Name</span>
                                    <span className="text-gray-500">{profile.full_name}</span>
                                </div>

                                {/* Username Row */}
                                <div className="flex justify-between items-center py-5 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">Username</span>
                                    <span className="text-gray-500">@{profile.username}</span>
                                </div>

                                {/* Email Row */}
                                <div className="flex justify-between items-center py-5 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">Email account</span>
                                    <span className="text-gray-500">{profile.email}</span>
                                </div>

                                {/* Login Method Row */}
                                <div className="flex justify-between items-center py-5 border-t border-gray-100">
                                    <span className="text-gray-600 font-medium">Login Method</span>
                                    <span className="text-gray-500 capitalize">{profile.provider === 'google' ? 'Google' : 'Email'}</span>
                                </div>

                                {/* Activity History Row */}
                                <div className="flex justify-between items-center py-5 border-t border-gray-100">
                                    <div className="flex items-center text-gray-600 font-medium">
                                        <History className="w-4 h-4 mr-2" />
                                        Activity History
                                    </div>
                                    <button
                                        onClick={fetchHistory}
                                        className="text-blue-500 hover:text-blue-600 font-medium text-sm focus:outline-none transition-colors"
                                    >
                                        View History &gt;
                                    </button>
                                </div>

                                {/* Account Security / Forgot Password Row */}
                                <div className="flex justify-between items-center py-5 border-t border-b border-gray-100">
                                    <div className="flex items-center text-gray-600 font-medium">
                                        <Key className="w-4 h-4 mr-2" />
                                        Account Security
                                    </div>
                                    <button
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-blue-500 hover:text-blue-600 font-medium text-sm focus:outline-none transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Enhanced History Modal */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="xl" centered>
                <Modal.Header closeButton className="border-b border-gray-100 bg-gray-50 pb-4">
                    <Modal.Title className="text-xl font-bold flex items-center text-gray-900">
                        <History className="w-6 h-6 mr-2 text-primary-500" />
                        Deleted Records History
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0 bg-gray-50">
                    {history && (
                        <div className="flex flex-col md:flex-row min-h-[500px]">
                            {/* Sidebar Tabs */}
                            <div className="md:w-64 bg-white border-r border-gray-200 p-4">
                                <nav className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab('businesses')}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'businesses' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <Building2 className={`w-5 h-5 mr-3 ${activeTab === 'businesses' ? 'text-primary-600' : 'text-gray-400'}`} />
                                        Businesses
                                        <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{history.businesses?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('accounts')}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'accounts' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <Wallet className={`w-5 h-5 mr-3 ${activeTab === 'accounts' ? 'text-primary-600' : 'text-gray-400'}`} />
                                        Accounts & Ledgers
                                        <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{history.accounts?.length || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'transactions' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <FileText className={`w-5 h-5 mr-3 ${activeTab === 'transactions' ? 'text-primary-600' : 'text-gray-400'}`} />
                                        Transactions
                                        <span className="ml-auto bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{history.transactions?.length || 0}</span>
                                    </button>
                                </nav>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto max-h-[60vh]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                                    >
                                        {activeTab === 'businesses' && (
                                            <div>
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <h3 className="text-lg font-medium text-gray-900">Deleted Businesses</h3>
                                                </div>
                                                {history.businesses && history.businesses.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</th>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {history.businesses.map(b => (
                                                                    <tr key={b.business_id} className="hover:bg-gray-50">
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.business_name}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.industry || 'N/A'}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                                {b.business_type}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-12 text-center">
                                                        <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                        <p className="text-gray-500 text-sm">No deleted businesses found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'accounts' && (
                                            <div>
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <h3 className="text-lg font-medium text-gray-900">Deleted Account/Ledgers</h3>
                                                </div>
                                                {history.accounts && history.accounts.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {history.accounts.map(a => (
                                                                    <tr key={a.account_id} className="hover:bg-gray-50">
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.account_name}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.business_name}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right font-mono">${parseFloat(a.balance).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-12 text-center">
                                                        <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                        <p className="text-gray-500 text-sm">No deleted accounts found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'transactions' && (
                                            <div>
                                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                    <h3 className="text-lg font-medium text-gray-900">Deleted Transactions</h3>
                                                </div>
                                                {history.transactions && history.transactions.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {history.transactions.map(t => (
                                                                    <tr key={t.transaction_id} className="hover:bg-gray-50">
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={t.description}>{t.description}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.business_name}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium text-right font-mono">{parseFloat(t.debit) > 0 ? `$${parseFloat(t.debit).toFixed(2)}` : '-'}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right font-mono">{parseFloat(t.credit) > 0 ? `$${parseFloat(t.credit).toFixed(2)}` : '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="px-6 py-12 text-center">
                                                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                                        <p className="text-gray-500 text-sm">No deleted transactions found.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-t border-gray-100 bg-gray-50">
                    <button
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowHistoryModal(false)}
                    >
                        Close Window
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
