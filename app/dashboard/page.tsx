'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { SalesStatsDto, WalletDto } from '@/lib/types';

interface KpiData {
  total_admins: number;
  total_policies: number;
  total_users: number;
  open_tickets: number;
  revenue_today: number;
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStatsDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);

  useEffect(() => {
    api.get<KpiData>('/dashboard/kpi').then(r => setKpi(r.data)).catch(() => {});
    api.get<SalesStatsDto>('/sales/stats/me').then(r => setSalesStats(r.data)).catch(() => {});
    api.get<WalletDto>('/wallets/me').then(r => setWallet(r.data)).catch(() => {});
  }, []);

  function formatAmount(amount?: number) {
    if (!amount) return '0 so\'m';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  }

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description="Tizim holati va statistika" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Jami adminlar"
          value={kpi?.total_admins ?? '—'}
          icon={<Users size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Jami foydalanuvchilar"
          value={kpi?.total_users ?? '—'}
          icon={<Users size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Jami polislar"
          value={kpi?.total_policies ?? '—'}
          icon={<FileText size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Mening sotuvlarim"
          value={salesStats?.totalSales ?? '—'}
          icon={<TrendingUp size={20} className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mening hamyonim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              <p className="text-xl font-bold text-primary">{wallet ? formatAmount(wallet.balance) : '—'}</p>
            </div>
            {wallet && <p className="text-xs text-muted-foreground mt-1">Jami cashback: {formatAmount(wallet.totalEarned)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jami sotilgan summa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatAmount(salesStats?.totalAmountUzs)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yangi murojaatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{kpi?.open_tickets ?? '—'}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
