'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { PolicyHistoryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY = { gosNumber: '', clientPhone: '', status: '', adminId: '', from: '', to: '' };

function statusVariant(status: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700 hover:bg-green-100';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-700 hover:bg-red-100';
  return '';
}

export default function HistoryPoliciesPage() {
  const [data, setData] = useState<PageResult<PolicyHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await api.get<PageResult<PolicyHistoryDto>>('/history/policies', { params: { ...search, page, size: 20 } });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: PolicyHistoryDto) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: PolicyHistoryDto) => <span className="font-mono font-semibold">{r.gosNumber}</span> },
    { key: 'clientPhone', label: 'Mijoz', render: (r: PolicyHistoryDto) => r.clientPhone },
    {
      key: 'status', label: 'Status',
      render: (r: PolicyHistoryDto) => <Badge className={statusVariant(r.status)}>{r.status}</Badge>
    },
    { key: 'amountUzs', label: 'Summa', render: (r: PolicyHistoryDto) => new Intl.NumberFormat('uz-UZ').format(r.amountUzs) + ' so\'m' },
    {
      key: 'sellerAdminName', label: 'Ro\'yxatlashtirildi',
      render: (r: PolicyHistoryDto) => r.sellerAdminName
        ? <span className="font-medium">{r.sellerAdminName}</span>
        : <span className="text-muted-foreground italic text-xs">Web sayt orqali</span>
    },
    { key: 'createdAt', label: 'Sana', render: (r: PolicyHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Polislar tarixi" description="Barcha OSAGO polislari" />
      <FilterBar
        fields={[
          { key: 'gosNumber', placeholder: 'Davlat raqami' },
          { key: 'clientPhone', placeholder: 'Mijoz telefoni' },
          { key: 'status', placeholder: 'Status' },
          { key: 'from', placeholder: 'Dan', type: 'date' },
          { key: 'to', placeholder: 'Gacha', type: 'date' },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onSearch={() => { setSearch(filters); setPage(0); }}
        onReset={() => { setFilters(EMPTY); setSearch(EMPTY); setPage(0); }}
      />
      <DataTable columns={columns as never} data={data.content as never} loading={loading} />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPageChange={setPage} />
    </DashboardLayout>
  );
}
