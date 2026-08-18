import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ShopkeeperManagement from './pages/admin/ShopkeeperManagement';
import GlobalInventory from './pages/admin/GlobalInventory';
import GlobalSales from './pages/admin/GlobalSales';

import ShopkeeperDashboard from './pages/shopkeeper/ShopkeeperDashboard';
import POS from './pages/shopkeeper/POS';
import InventoryManagement from './pages/shopkeeper/InventoryManagement';
import SalesHistory from './pages/shopkeeper/SalesHistory';

// Main App Layout Wrapper (Navbar + Sidebar + Content)
const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Root index redirect based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/shopkeeper/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<MainLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/shopkeepers" element={<ShopkeeperManagement />} />
              <Route path="/admin/inventory" element={<GlobalInventory />} />
              <Route path="/admin/sales" element={<GlobalSales />} />
            </Route>
          </Route>

          {/* Protected Shopkeeper Routes */}
          <Route element={<ProtectedRoute allowedRoles={['shopkeeper']} />}>
            <Route element={<MainLayout />}>
              <Route path="/shopkeeper/dashboard" element={<ShopkeeperDashboard />} />
              <Route path="/shopkeeper/pos" element={<POS />} />
              <Route path="/shopkeeper/inventory" element={<InventoryManagement />} />
              <Route path="/shopkeeper/sales" element={<SalesHistory />} />
            </Route>
          </Route>

          {/* Root Fallback */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
