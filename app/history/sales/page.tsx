'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { SoldPolicyDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY = { gosNumber: '', clientPhone: '', from: '', to: '' };

function fmt(n?: number | null) {
  if (!n) return "0 so'm";
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

function ratePct(rate?: number) {
  if (rate == null) return null;
  const pct = rate <= 1 ? rate * 100 : rate;
  return pct.toFixed(1) + '%';
}

export default function SoldPoliciesPage() {
  const [data, setData] = useState<PageResult<SoldPolicyDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await api.get<PageResult<SoldPolicyDto>>('/history/sales', { params: { ...search, page, size: 20 } });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: SoldPolicyDto) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: SoldPolicyDto) => <span className="font-mono font-semibold">{r.gosNumber || '—'}</span> },
    { key: 'clientPhone', label: 'Mijoz', render: (r: SoldPolicyDto) => <span className="font-mono text-sm">{r.clientPhone || '—'}</span> },
    {
      key: 'policyNumber', label: 'Polis raqami',
      render: (r: SoldPolicyDto) => (r.policySery || r.policyNumber)
        ? <span className="font-mono text-sm font-medium">{[r.policySery, r.policyNumber].filter(Boolean).join(' ')}</span>
        : <span className="text-muted-foreground text-xs">—</span>
    },
    { key: 'amountUzs', label: 'Summa', render: (r: SoldPolicyDto) => fmt(r.amountUzs) },
    {
      key: 'seller', label: 'Sotuvchi',
      render: (r: SoldPolicyDto) => r.sellerType === 'ADMIN'
        ? <span className="font-medium">{r.adminName || 'Admin'}</span>
        : <Badge variant="outline" className="text-muted-foreground">Web sayt orqali</Badge>
    },
    {
      key: 'cashback', label: 'Cashback',
      render: (r: SoldPolicyDto) => {
        if (r.sellerType === 'ADMIN') {
          return (
            <span className="text-emerald-600 font-medium">
              {fmt(r.adminCashbackAmount)}
              {ratePct(r.adminCashbackRate) && <span className="text-xs text-muted-foreground ml-1">({ratePct(r.adminCashbackRate)})</span>}
            </span>
          );
        }
        return (
          <span className="text-emerald-600 font-medium">
            {r.userCashbackAmount ? fmt(r.userCashbackAmount) : '—'}
            <span className="text-xs text-muted-foreground ml-1">(userga)</span>
          </span>
        );
      }
    },
    { key: 'paidAt', label: 'Sotilgan sana', render: (r: SoldPolicyDto) => format(new Date(r.paidAt || r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Sotilgan polislar" description="To'langan (sotilgan) OSAGO polislari" />
      <FilterBar
        fields={[
          { key: 'gosNumber', placeholder: 'Davlat raqami' },
          { key: 'clientPhone', placeholder: 'Mijoz telefoni' },
          { key: 'from', placeholder: 'Dan', type: 'date' },
          { key: 'to', placeholder: 'Gacha', type: 'date' },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onSearch={() => { setSearch(filters); setPage(0); }}
        onReset={() => { setFilters(EMPTY); setSearch(EMPTY); setPage(0); }}
      />
      <div className="mb-4 rounded-lg border border-border bg-card p-3 inline-block min-w-40">
        <p className="text-xs text-muted-foreground">Jami sotilgan</p>
        <p className="text-lg font-bold">{data.totalElements} ta</p>
      </div>
      <DataTable columns={columns as never} data={data.content as never} loading={loading} emptyMessage="Sotilgan polislar topilmadi" />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPageChange={setPage} />
    </DashboardLayout>
  );
}
