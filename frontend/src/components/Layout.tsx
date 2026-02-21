import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Truck, Route, Wrench, Receipt, Users, BarChart3, LogOut, Menu, X, Truck as TruckLogo } from 'lucide-react';
import { useFleet } from '@/contexts/FleetContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/fleet';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as UserRole[] },
  { path: '/vehicles', label: 'Vehicle Registry', icon: Truck, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] as UserRole[] },
  { path: '/trips', label: 'Trip Dispatcher', icon: Route, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer'] as UserRole[] },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Fleet Manager', 'Safety Officer'] as UserRole[] },
  { path: '/expenses', label: 'Trip & Expense', icon: Receipt, roles: ['Fleet Manager', 'Financial Analyst'] as UserRole[] },
  { path: '/drivers', label: 'Performance', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] as UserRole[] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['Fleet Manager', 'Financial Analyst'] as UserRole[] },
];

export const Layout = () => {
  const { user, logout } = useFleet();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F7FA]">

      {/* ── Sidebar ── dark navy #21295C ──────────────────────────────── */}
      <aside className={cn(
        'flex flex-col transition-all duration-300 shrink-0',
        'bg-[#21295C]',
        sidebarOpen ? 'w-60' : 'w-0 md:w-16'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/10">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#065A82]">
            <TruckLogo className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-extrabold tracking-tight text-white">
              Fleet<span className="text-[#9EB3C2]">Flow</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.filter(item => !user || item.roles.includes(user.role)).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-[#21295C] font-semibold'
                  : 'text-[#9EB3C2] hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        {sidebarOpen && user && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-[#065A82] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-[#9EB3C2] truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#9EB3C2] hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.role}</span>
            <div className="h-8 w-8 rounded-full bg-[#1B3B6F] flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
