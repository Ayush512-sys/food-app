import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Star,
  QrCode,
  CreditCard,
  AlertTriangle,
  UserCheck,
  TrendingDown,
  LineChart,
  FileSpreadsheet,
  Building,
  Users,
  Compass,
  FileText,
  Megaphone,
  Settings
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [role, setRole] = useState('student');

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setRole(user.role);
      } catch (e) {}
    }
  }, []);

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/menu', label: 'Weekly Menu', icon: FileText },
    { to: '/student/leave', label: 'Mark Absence', icon: CalendarCheck },
    { to: '/student/feedback', label: 'Meal Feedback', icon: Star },
    { to: '/student/payments', label: 'Subscription', icon: CreditCard },
    { to: '/student/complaints', label: 'Complaints', icon: AlertTriangle }
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/attendance', label: 'Live Attendance', icon: UserCheck },
    { to: '/manager/students', label: 'Students', icon: Users },
    { to: '/manager/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/manager/complaints', label: 'Complaints', icon: AlertTriangle },
    { to: '/manager/forecasting', label: 'AI Forecasting', icon: LineChart },
    { to: '/manager/waste', label: 'Waste Manager', icon: TrendingDown },
    { to: '/manager/menu', label: 'Menu Planner', icon: FileText },
    { to: '/manager/settings', label: 'Settings', icon: Settings },
    { to: '/manager/reports', label: 'Reports', icon: FileSpreadsheet }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Panel', icon: LayoutDashboard }
  ];

  const links = role === 'admin' ? adminLinks : (role === 'manager' ? managerLinks : studentLinks);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed md:relative z-50 w-64 bg-slate-900 text-slate-100 flex flex-col h-screen shrink-0 border-r border-slate-800 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-lg">
          F
        </div>
        <div>
          <h2 className="font-extrabold text-sm tracking-wide text-white font-sans uppercase">
            foodback.management
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Mess Waste Reduction
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
          Dashboard Menu
        </p>
        
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Icon size={16} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center">
        <p className="text-[10px] text-slate-500 font-medium">foodback.management v1.0.0</p>
        <p className="text-[9px] text-slate-600 mt-0.5">© 2026 Platform Inc.</p>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
