'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, History, DollarSign, Wallet,
  TrendingUp, ShieldCheck, LogOut, ChevronDown, ChevronRight,
  FileText, Car, Calculator, UserCheck, Settings, KeyRound, Clock
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { clearAuth, getUser } from '@/lib/auth';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Adminlar', href: '/admins', icon: <Users size={18} /> },
  {
    label: 'Tarix', icon: <History size={18} />,
    children: [
      { label: 'Foydalanuvchilar', href: '/history/users', icon: <UserCheck size={16} /> },
      { label: 'Polislar', href: '/history/policies', icon: <FileText size={16} /> },
      { label: 'Kalkulyatsiyalar', href: '/history/calculations', icon: <Calculator size={16} /> },
      { label: 'Avtomobillar', href: '/history/vehicles', icon: <Car size={16} /> },
      { label: 'Admin amallar', href: '/history/admins', icon: <ShieldCheck size={16} /> },
    ],
  },
  { label: 'Cashback', href: '/cashback', icon: <DollarSign size={18} /> },
  { label: 'Hamyonlar', href: '/wallets', icon: <Wallet size={18} /> },
  { label: 'Sotuvlar', href: '/sales', icon: <TrendingUp size={18} /> },
  { label: "Sug'urta Sotish", href: '/osago-sell', icon: <ShieldCheck size={18} /> },
  { label: "Jarayondagi To'lovlar", href: '/pending-payments', icon: <Clock size={18} /> },
  { label: 'Rollar', href: '/roles', icon: <KeyRound size={18} /> },
  { label: 'Sozlamalar', href: '/settings', icon: <Settings size={18} /> },
];

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() =>
    item.children?.some(c => c.href && pathname.startsWith(c.href)) ?? false
  );

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
            'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors'
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map(child => (
              <NavLink key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + '/') : false;

  return (
    <Link
      href={item.href!}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
      )}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">UzPolis</p>
            <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
            {user?.phone?.slice(-2) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name || user?.phone || 'Admin'}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut size={16} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
