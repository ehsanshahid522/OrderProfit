import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/Auth/AuthPage';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { OrdersPage } from './components/Orders/OrdersPage';
import { ProductSheetsPage } from './components/ProductSheets/ProductSheetsPage';
import { CompanyPage } from './components/Company/CompanyPage';
import { InsightsPage } from './components/Insights/InsightsPage';

function AppContent() {
    const { user, loading } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    return (
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'orders' && <OrdersPage />}
            {currentPage === 'product-sheets' && <ProductSheetsPage />}
            {currentPage === 'company' && <CompanyPage />}
            {currentPage === 'insights' && <InsightsPage />}
        </Layout>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
