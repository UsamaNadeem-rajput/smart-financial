import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import Navbar from '../layout/Navbar';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Download,
    TrendingUp,
    FileText,
    Scale,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to convert image URL to data URL using proxy endpoint
async function getImageAsDataUrl(logoPath, backendUrl) {
    try {
        const filename = logoPath.split('/').pop();
        const proxyUrl = `${backendUrl}/api/business/logo-proxy/${filename}`;
        const response = await fetch(proxyUrl, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error converting image to data URL:', error);
        return null;
    }
}

const BalanceSheet = () => {
    const { selectedBusiness } = useBusiness();
    const navigate = useNavigate();
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState({ assets: [], liabilities: [], equity: [], totals: {} });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!selectedBusiness) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet/${selectedBusiness.business_id}`,
                {
                    params: { targetDate },
                    withCredentials: true
                }
            );
            setData(res.data);
        } catch (err) {
            console.error('Error fetching balance sheet:', err);
            setError('Failed to load balance sheet data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBusiness, targetDate]);

    // Format Currency
    const currency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const downloadPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const apiUrl = import.meta.env.VITE_BACKEND_URL;

        let y = 15;
        const logoPath = selectedBusiness?.logo_url;
        let logoDataUrl = null;
        if (logoPath) {
            logoDataUrl = await getImageAsDataUrl(logoPath, apiUrl);
        }

        // === HEADER SECTION ===
        const headerY = y;
        const logoWidth = 25;
        let logoHeight = 25;

        // Draw Logo
        if (logoDataUrl) {
            try {
                const img = new Image();
                img.src = logoDataUrl;
                await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
                logoHeight = (img.height * logoWidth) / img.width;
                doc.addImage(logoDataUrl, 'PNG', 10, headerY - 5, logoWidth, logoHeight);
            } catch (e) {
                // Fallback logo
                doc.setFillColor(65, 105, 225);
                doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
            }
        } else {
            doc.setFillColor(65, 105, 225);
            doc.rect(10, headerY - 5, logoWidth, logoWidth, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text("SF", 10 + logoWidth / 2, headerY + 8, { align: "center" });
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont(undefined, "bold");
        doc.text(selectedBusiness?.business_name || 'Business Name', pageWidth / 2, headerY, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont(undefined, "normal");
        doc.setTextColor(65, 105, 225); // Primary Blue
        doc.text('Balance Sheet', pageWidth / 2, headerY + 8, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`As of ${targetDate}`, pageWidth / 2, headerY + 14, { align: 'center' });

        const lineY = Math.max(headerY + logoHeight, headerY + 18);
        doc.setDrawColor(65, 105, 225);
        doc.setLineWidth(0.5);
        doc.line(10, lineY, pageWidth - 10, lineY);
        y = lineY + 10;

        // === ASSETS ===
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, "bold");
        doc.text('Assets', 14, y);
        y += 4;

        const assetRows = data.assets.map(a => [a.name, currency(a.balance)]);
        assetRows.push([{ content: 'Total Assets', styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }, { content: currency(data.totals.total_assets), styles: { fontStyle: 'bold', fillColor: [240, 253, 244], halign: 'right' } }]);

        autoTable(doc, {
            startY: y,
            head: [['Account', { content: 'Amount (PKR)', styles: { halign: 'right' } }]],
            body: assetRows,
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74], textColor: 255 }, // Green
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 10;

        // === LIABILITIES ===
        doc.text('Liabilities', 14, y);
        y += 4;

        const liabRows = data.liabilities.map(l => [l.name, currency(l.balance)]);
        const totalLiab = data.liabilities.reduce((sum, item) => sum + item.balance, 0);
        liabRows.push([{ content: 'Total Liabilities', styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } }, { content: currency(totalLiab), styles: { fontStyle: 'bold', fillColor: [254, 242, 242], halign: 'right' } }]);

        autoTable(doc, {
            startY: y,
            head: [['Account', { content: 'Amount (PKR)', styles: { halign: 'right' } }]],
            body: liabRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38], textColor: 255 }, // Red
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 10;

        // === EQUITY ===
        doc.text('Capital', 14, y);
        y += 4;

        const equityRows = data.equity
            .filter(e => !e.name.includes("Net Profit") && !e.name.includes("Net Loss"))
            .map(e => [e.name, currency(e.balance)]);
        const totalEquity = data.equity.reduce((sum, item) => sum + item.balance, 0);
        equityRows.push([{ content: 'Total Capital', styles: { fontStyle: 'bold', fillColor: [239, 246, 255] } }, { content: currency(totalEquity), styles: { fontStyle: 'bold', fillColor: [239, 246, 255], halign: 'right' } }]);

        autoTable(doc, {
            startY: y,
            head: [['Account', { content: 'Amount (PKR)', styles: { halign: 'right' } }]],
            body: equityRows,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // Blue
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 10;

        // === GRAND TOTAL ===
        autoTable(doc, {
            startY: y,
            body: [
                [{ content: 'Total Liabilities & Capital', styles: { fontStyle: 'bold', halign: 'left', fontSize: 12 } }, { content: currency(data.totals.total_liabilities_equity), styles: { fontStyle: 'bold', halign: 'right', fontSize: 12, textColor: [37, 99, 235] } }]
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 }
        });

        doc.save(`Balance_Sheet_${targetDate}.pdf`);
    };

    if (!selectedBusiness) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <p className="text-xl">Please select a business to view the Balance Sheet.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            {/* Background Effects matching IncomeReport */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <div className="relative z-10 font-sans">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 text-white">
                        <div className="flex items-center">
                            <button onClick={() => navigate(-1)} className="mr-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center">
                                    <Scale className="mr-3 h-8 w-8 text-blue-400" />
                                    Balance Sheet
                                </h1>
                                <p className="mt-1 text-sm text-blue-200">
                                    Financial Position Statement
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Controls & Summary */}
                    <div className="bg-white rounded-xl shadow-xl p-6 mb-8 backdrop-blur-sm bg-white/95 border border-white/20">
                        {/* Date Selection - Left Aligned as requested */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    As of Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                                    <input
                                        type="date"
                                        value={targetDate}
                                        onChange={(e) => setTargetDate(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-2 border-primary-100 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all w-full sm:w-64"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={downloadPDF}
                                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </button>
                        </div>

                        {/* Report Header */}
                        {!loading && !error && (
                            <div className="text-center mb-8 pb-6 border-b border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                                    {selectedBusiness?.business_name}
                                </h2>
                                <h3 className="text-xl text-primary-600 font-semibold mt-1">
                                    Balance Sheet
                                </h3>
                                <p className="text-gray-500 mt-2 font-medium">
                                    As of {new Date(targetDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-green-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                        <p className="text-sm font-medium text-green-700 uppercase tracking-widest">Total Assets</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                            {currency(data.totals.total_assets || 0)}
                                        </h3>
                                        <TrendingUp className="w-8 h-8 text-green-500 absolute bottom-4 right-4 opacity-50" />
                                    </div>

                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-red-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                        <p className="text-sm font-medium text-red-700 uppercase tracking-widest">Total Liabilities</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                            {currency(data.liabilities.reduce((acc, curr) => acc + curr.balance, 0))}
                                        </h3>
                                        <FileText className="w-8 h-8 text-red-500 absolute bottom-4 right-4 opacity-50" />
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                                        <p className="text-sm font-medium text-blue-700 uppercase tracking-widest">Total Capital</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                            {currency(data.equity.reduce((acc, curr) => acc + curr.balance, 0))}
                                        </h3>
                                        <Scale className="w-8 h-8 text-blue-500 absolute bottom-4 right-4 opacity-50" />
                                    </div>
                                </div>

                                {/* Detailed Tables */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Assets Column */}
                                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                            <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                                <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                                                Assets
                                            </h2>
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                                                {data.assets.length} Accounts
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {data.assets.length > 0 ? (
                                                data.assets.map((item, index) => (
                                                    <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/80 transition-colors">
                                                        <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                                        <span className="text-sm font-bold text-gray-900 font-mono">{currency(item.balance)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-6 py-8 text-center text-gray-400 text-sm">No assets recorded.</div>
                                            )}
                                        </div>
                                        <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                                            <span className="font-bold text-gray-700">Total Assets</span>
                                            <span className="font-bold text-green-600 text-lg">{currency(data.totals.total_assets)}</span>
                                        </div>
                                    </div>

                                    {/* Liabilities & Equity Column */}
                                    <div className="space-y-8">
                                        {/* Liabilities */}
                                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                                    <div className="w-2 h-6 bg-red-500 rounded-full mr-3"></div>
                                                    Liabilities
                                                </h2>
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                                                    {data.liabilities.length} Accounts
                                                </span>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {data.liabilities.length > 0 ? (
                                                    data.liabilities.map((item, index) => (
                                                        <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/80 transition-colors">
                                                            <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                                            <span className="text-sm font-bold text-gray-900 font-mono">{currency(item.balance)}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-6 py-8 text-center text-gray-400 text-sm">No liabilities recorded.</div>
                                                )}
                                            </div>
                                            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="font-bold text-gray-700">Total Liabilities</span>
                                                <span className="font-bold text-red-600 text-lg">
                                                    {currency(data.liabilities.reduce((acc, curr) => acc + curr.balance, 0))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Equity */}
                                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                                                    <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                                                    Capital
                                                </h2>
                                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                                    {data.equity.length} Accounts
                                                </span>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {data.equity.length > 0 ? (
                                                    data.equity
                                                        .filter(item => !item.name.includes("Net Profit") && !item.name.includes("Net Loss"))
                                                        .map((item, index) => (
                                                            <div key={index} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/80 transition-colors">
                                                                <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                                                <span className={`text-sm font-bold font-mono ${item.name.includes('Profit') ? 'text-green-600' : item.name.includes('Loss') ? 'text-red-500' : 'text-gray-900'}`}>{currency(item.balance)}</span>
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="px-6 py-8 text-center text-gray-400 text-sm">No capital accounts recorded.</div>
                                                )}
                                            </div>
                                            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                                                <span className="font-bold text-gray-700">Total Capital</span>
                                                <span className="font-bold text-blue-600 text-lg">
                                                    {currency(data.equity.reduce((acc, curr) => acc + curr.balance, 0))}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Check */}
                                        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6 flex justify-between items-center shadow-inner">
                                            <div>
                                                <p className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Total Liabilities & Capital</p>
                                                <p className="text-xs text-indigo-500 mt-1">Matched against Assets</p>
                                            </div>
                                            <h3 className="text-2xl font-bold text-indigo-700">
                                                {currency(data.totals.total_liabilities_equity)}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
