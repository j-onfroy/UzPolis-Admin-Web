'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { SalesStatsDto, AdminSalesStatsDto, SaleDto, PageResult } from '@/lib/types';
import { TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ title, value, icon, sub }: { title: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesPage() {
  const [myStats, setMyStats] = useState<SalesStatsDto | null>(null);
  const [allStats, setAllStats] = useState<AdminSalesStatsDto | null>(null);
  const [mySales, setMySales] = useState<SaleDto[]>([]);
  const [myPage] = useState(0);
  const [myTotal, setMyTotal] = useState(0);

  useEffect(() => {
    api.get<SalesStatsDto>('/sales/stats/me').then(r => setMyStats(r.data)).catch(() => {});
    api.get<AdminSalesStatsDto>('/sales/stats/all').then(r => setAllStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get<PageResult<SaleDto>>('/sales/my', { params: { page: myPage, size: 20 } })
      .then(r => { setMySales(r.data?.content ?? []); setMyTotal(r.data?.totalElements ?? 0); })
      .catch(() => {});
  }, [myPage]);

  function fmt(n?: number | null) {
    if (!n) return '0 so\'m';
    return new Intl.NumberFormat('uz-UZ').format(n) + ' so\'m';
  }

  const adminStatsColumns = [
    { key: 'adminName', label: 'Admin', render: (r: SalesStatsDto) => <span className="font-medium">{r.adminName || `#${r.adminId}`}</span> },
    { key: 'totalSales', label: 'Sotuvlar', render: (r: SalesStatsDto) => r.totalSales },
    { key: 'totalAmountUzs', label: 'Summa', render: (r: SalesStatsDto) => fmt(r.totalAmountUzs) },
    { key: 'totalCashback', label: 'Cashback', render: (r: SalesStatsDto) => <span className="text-green-600 font-semibold">{fmt(r.totalCashback)}</span> },
    { key: 'pendingCashback', label: 'Kutilmoqda', render: (r: SalesStatsDto) => fmt(r.pendingCashback) },
  ];

  const mySalesColumns = [
    { key: 'id', label: 'ID', render: (r: SaleDto) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: SaleDto) => <span className="font-mono font-semibold">{r.gosNumber}</span> },
    { key: 'clientPhone', label: 'Mijoz', render: (r: SaleDto) => r.clientPhone || '—' },
    { key: 'amountUzs', label: 'Summa', render: (r: SaleDto) => fmt(r.amountUzs) },
    { key: 'cashbackAmount', label: 'Cashback', render: (r: SaleDto) => <span className="text-green-600">{fmt(r.cashbackAmount)}</span> },
    {
      key: 'cashbackPaid', label: "To'landi",
      render: (r: SaleDto) => (
        <Badge className={r.cashbackPaid ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''} variant={r.cashbackPaid ? 'default' : 'outline'}>
          {r.cashbackPaid ? 'Ha' : 'Kutilmoqda'}
        </Badge>
      )
    },
    { key: 'createdAt', label: 'Sana', render: (r: SaleDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Sotuvlar" description="Sotuv statistikasi va tarix" />

      {myStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard title="Mening sotuvlarim" value={String(myStats.totalSales)} icon={<TrendingUp size={18} className="text-primary" />} />
          <StatCard title="Jami summa" value={fmt(myStats.totalAmountUzs)} icon={<DollarSign size={18} className="text-primary" />} />
          <StatCard title="Jami cashback" value={fmt(myStats.totalCashback)} icon={<Wallet size={18} className="text-green-600" />} sub={myStats.pendingCashback ? `${fmt(myStats.pendingCashback)} kutilmoqda` : undefined} />
        </div>
      )}

      <Tabs defaultValue="my">
        <TabsList className="mb-6">
          <TabsTrigger value="my">Mening sotuvlarim</TabsTrigger>
          <TabsTrigger value="all">Barcha adminlar</TabsTrigger>
        </TabsList>

        <TabsContent value="my">
          <DataTable columns={mySalesColumns as never} data={mySales as never} emptyMessage="Sotuvlar topilmadi" />
          <div className="mt-2 text-xs text-muted-foreground">Jami: {myTotal} ta sotuv</div>
        </TabsContent>

        <TabsContent value="all">
          {allStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard title="Jami sotuvlar" value={String(allStats.totalSales)} icon={<TrendingUp size={18} className="text-primary" />} />
              <StatCard title="Jami summa" value={fmt(allStats.totalAmountUzs)} icon={<DollarSign size={18} className="text-primary" />} />
              <StatCard title="Jami cashback" value={fmt(allStats.totalCashback)} icon={<Wallet size={18} className="text-green-600" />} />
              <StatCard title="Kutilmoqda" value={fmt(allStats.pendingCashback)} icon={<Wallet size={18} className="text-orange-500" />} />
            </div>
          )}
          <DataTable columns={adminStatsColumns as never} data={(allStats?.adminStats ?? []) as never} emptyMessage="Ma'lumot yo'q" />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
