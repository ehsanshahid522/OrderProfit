import React, { useState } from 'react';
import { X, Calendar, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ExportPDFModal({ orders, onClose, businessName }) {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const setQuickRange = (type) => {
        const end = new Date();
        let start = new Date();

        if (type === 'today') {
            start = new Date();
        } else if (type === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'month') {
            start.setMonth(end.getMonth() - 1);
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        });
    };

    const handleDownload = () => {
        try {
            // Fixed date filter: use timestamps for accurate comparison
            const startTime = new Date(dateRange.start + 'T00:00:00').getTime();
            const endTime = new Date(dateRange.end + 'T23:59:59').getTime();

            const filteredOrders = orders
                .filter(order => {
                    const orderDate = order.createdAt || order.orderDate;
                    const orderTime = new Date(orderDate).getTime();
                    return orderTime >= startTime && orderTime <= endTime;
                })
                .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));

            if (filteredOrders.length === 0) {
                alert('No orders found for the selected date range.');
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // Header
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(businessName || 'OrderProfit Report', 14, 22);

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`Order Sheet: ${dateRange.start} to ${dateRange.end}`, 14, 30);

            // Table data
            const tableBody = filteredOrders.map(order => [
                `#${order.orderNo || order.orderNumber}`,
                new Date(order.createdAt || order.orderDate).toLocaleDateString(),
                order.productName,
                (order.status || order.deliveryStatus || '').toUpperCase(),
                `Rs. ${Number(order.sellingPrice || order.orderPrice || 0).toLocaleString()}`,
                `Rs. ${Number(order.totalCosts || order.totalCost || 0).toLocaleString()}`,
                `Rs. ${Number(order.profit || 0).toLocaleString()}`,
            ]);

            autoTable(doc, {
                startY: 40,
                head: [['ID', 'Date', 'Product', 'Status', 'Revenue', 'Cost', 'Profit']],
                body: tableBody,
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { top: 40 },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                },
            });

            // Summary
            const finalY = (doc.lastAutoTable?.finalY || 150) + 10;
            const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.sellingPrice || o.orderPrice || 0), 0);
            const totalCost = filteredOrders.reduce((sum, o) => sum + Number(o.totalCosts || o.totalCost || 0), 0);
            const totalProfit = filteredOrders.reduce((sum, o) => sum + Number(o.profit || 0), 0);

            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            doc.text(`Total Orders: ${filteredOrders.length}`, 14, finalY);
            doc.text(`Total Revenue: Rs. ${totalRevenue.toLocaleString()}`, pageWidth - 14, finalY, { align: 'right' });
            doc.text(`Total Cost: Rs. ${totalCost.toLocaleString()}`, pageWidth - 14, finalY + 7, { align: 'right' });

            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(79, 70, 229); // indigo-600
            doc.text(`Net Profit: Rs. ${totalProfit.toLocaleString()}`, pageWidth - 14, finalY + 16, { align: 'right' });

            doc.save(`OrderSheet_${dateRange.start}_to_${dateRange.end}.pdf`);
            onClose();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative scale-[1.02]">
                <div className="absolute top-0 left-0 w-full h-1.5 vibrant-gradient"></div>
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Download Report</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Select Date Range</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setQuickRange('today')} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 transition-all">Today</button>
                        <button onClick={() => setQuickRange('week')} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 transition-all">Last 7 Days</button>
                        <button onClick={() => setQuickRange('month')} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 transition-all">Last 30 Days</button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="w-full pl-11 pr-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 inline-flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
