import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { SocketProvider } from './components/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Layout wrapper for authenticated pages
const DashboardLayout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-transparent relative z-10">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Wrapper to extract title from route
const StudentLayout = () => {
  const location = useLocation();
  const titles = {
    '/student/dashboard': 'Student Dashboard',
    '/student/leave': 'Mark Absence',
    '/student/feedback': 'Meal Feedback',
    '/student/payments': 'Subscription & Payments',
    '/student/complaints': 'Complaints',
    '/student/menu': 'Weekly Menu'
  };
  const title = titles[location.pathname] || 'Student Dashboard';

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <DashboardLayout title={title}>
        <StudentDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

const ManagerLayout = () => {
  const location = useLocation();
  const titles = {
    '/manager/dashboard': 'Mess Manager Dashboard',
    '/manager/attendance': 'Live Attendance Monitor',
    '/manager/students': 'Student Management',
    '/manager/forecasting': 'AI Food Forecasting',
    '/manager/waste': 'Waste Management',
    '/manager/menu': 'Menu Planner',
    '/manager/reports': 'Reports & Export',
    '/manager/announcements': 'Announcements',
    '/manager/complaints': 'Complaints Management',
    '/manager/settings': 'Settings'
  };
  const title = titles[location.pathname] || 'Manager Dashboard';

  return (
    <ProtectedRoute allowedRoles={['manager']}>
      <DashboardLayout title={title}>
        <ManagerDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

const AdminLayout = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="System Administration">
        <AdminDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

import Background from './components/Background';

function App() {
  return (
    <ThemeProvider>
      <Background />
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentLayout />} />
            <Route path="/student/leave" element={<StudentLayout />} />
            <Route path="/student/feedback" element={<StudentLayout />} />
            <Route path="/student/payments" element={<StudentLayout />} />
            <Route path="/student/complaints" element={<StudentLayout />} />
            <Route path="/student/menu" element={<StudentLayout />} />

            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<ManagerLayout />} />
            <Route path="/manager/attendance" element={<ManagerLayout />} />
            <Route path="/manager/students" element={<ManagerLayout />} />
            <Route path="/manager/forecasting" element={<ManagerLayout />} />
            <Route path="/manager/waste" element={<ManagerLayout />} />
            <Route path="/manager/menu" element={<ManagerLayout />} />
            <Route path="/manager/reports" element={<ManagerLayout />} />
            <Route path="/manager/announcements" element={<ManagerLayout />} />
            <Route path="/manager/complaints" element={<ManagerLayout />} />
            <Route path="/manager/settings" element={<ManagerLayout />} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminLayout />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
