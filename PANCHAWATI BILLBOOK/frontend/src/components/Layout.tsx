import { Outlet, Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Package, LayoutDashboard, Users, FileText, Settings, LogOut, ScanLine, Menu, X, Receipt } from 'lucide-react';
import { MobileScanner } from './scanner/MobileScanner';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-gray-100 dark:bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold dark:text-white">BillBook</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/customers" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <Users className="mr-3 h-5 w-5 text-gray-400" />
                Customers
              </Link>
            </li>
            <li>
              <Link to="/suppliers" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <Users className="mr-3 h-5 w-5 text-gray-400" />
                Suppliers
              </Link>
            </li>
            <li>
              <Link to="/inventory" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <Package className="mr-3 h-5 w-5 text-gray-400" />
                Inventory
              </Link>
            </li>
            <li>
              <Link to="/sales" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <FileText className="mr-3 h-5 w-5 text-gray-400" />
                Sales
              </Link>
            </li>
            <li>
              <Link to="/purchases" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <FileText className="mr-3 h-5 w-5 text-gray-400" />
                Purchases
              </Link>
            </li>
            <li>
              <Link to="/accounting" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <FileText className="mr-3 h-5 w-5 text-gray-400" />
                Accounting
              </Link>
            </li>
            <li>
              <Link to="/reports" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <FileText className="mr-3 h-5 w-5 text-gray-400" />
                Reports
              </Link>
            </li>
            <li>
              <Link to="/employees" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <Users className="mr-3 h-5 w-5 text-gray-400" />
                Employees
              </Link>
            </li>
            <li>
              <Link to="/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                <Settings className="mr-3 h-5 w-5 text-gray-400" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user.role}</p>
            </div>
            <button onClick={logout} className="ml-2 p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pb-16 md:pb-0 relative">
        <header className="h-16 flex-none flex items-center justify-between px-4 bg-white border-b border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 md:hidden z-10 relative">
          <h1 className="text-xl font-bold dark:text-white">BillBook</h1>
          <div className="flex items-center space-x-2">
            <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-500">
               <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile slide-out menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-zinc-900">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <h1 className="text-xl font-bold dark:text-white">BillBook Menu</h1>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  <Link to="/customers" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <Users className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Customers
                  </Link>
                  <Link to="/suppliers" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <Users className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Suppliers
                  </Link>
                  <Link to="/sales" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <FileText className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Sales
                  </Link>
                  <Link to="/purchases" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <FileText className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Purchases
                  </Link>
                  <Link to="/accounting" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <FileText className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Accounting
                  </Link>
                  <Link to="/reports" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <FileText className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Reports
                  </Link>
                  <Link to="/employees" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <Users className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Employees
                  </Link>
                  <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <Settings className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    Settings
                  </Link>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-zinc-700 p-4">
                <div className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-700 dark:text-white">{user.name}</p>
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{user.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-gray-50 dark:bg-zinc-950 relative custom-scrollbar">
          <div className="flex-1 flex flex-col pb-24 md:pb-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-40 px-2 pb-safe">
        <div className="flex justify-between items-center h-16 relative">
          <Link to="/" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            <LayoutDashboard className="h-6 w-6 mb-1 pointer-events-none" />
            <span className="text-[10px] font-medium pointer-events-none">Home</span>
          </Link>
          <Link to="/inventory" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            <Package className="h-6 w-6 mb-1 pointer-events-none" />
            <span className="text-[10px] font-medium pointer-events-none">Stock</span>
          </Link>
          
          <div className="flex flex-col items-center justify-center w-[20%] h-full relative">
            <span className="text-[10px] font-medium text-gray-700 dark:text-zinc-300 absolute bottom-1">Scan</span>
          </div>

          <Link to="/billing" className="flex flex-col items-center justify-center w-[20%] h-full text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
             <Receipt className="h-6 w-6 mb-1 pointer-events-none" />
             <span className="text-[10px] font-medium pointer-events-none">Billing</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center justify-center w-[20%] h-full text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            <Menu className="h-6 w-6 mb-1 pointer-events-none" />
            <span className="text-[10px] font-medium pointer-events-none">Menu</span>
          </button>
        </div>
      </nav>

      {/* Floating Scan Button - Totally outside nav bounds to prevent touch clipping */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pb-safe pointer-events-none flex justify-center">
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="bg-indigo-600 text-white rounded-full p-4 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-indigo-700 active:bg-indigo-800 active:scale-90 transition-all pointer-events-auto flex items-center justify-center touch-manipulation"
        >
          <ScanLine className="h-7 w-7 pointer-events-none" />
        </button>
      </div>

      {/* Scanner Component */}
      {isScannerOpen && <MobileScanner onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}
