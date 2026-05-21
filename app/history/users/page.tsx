'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { UserHistoryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY_FILTERS = { phone: '', status: '', from: '', to: '' };

export default function HistoryUsersPage() {
  const [data, setData] = useState<PageResult<UserHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = { ...search, page, size: 20 };
      const { data: res } = await api.get<PageResult<UserHistoryDto>>('/history/users', { params });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: UserHistoryDto) => <span className="font-mono text-xs text-muted-foreground">#{r.id}</span> },
    { key: 'phoneNumber', label: 'Telefon', render: (r: UserHistoryDto) => <span className="font-medium">{r.phoneNumber}</span> },
    { key: 'fullName', label: 'Ismi', render: (r: UserHistoryDto) => r.fullName || '—' },
    {
      key: 'status', label: 'Status',
      render: (r: UserHistoryDto) => (
        <Badge variant={r.status === 'ACTIVE' ? 'default' : 'secondary'}
          className={r.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
          {r.status}
        </Badge>
      )
    },
    { key: 'isVerified', label: 'Tasdiqlangan', render: (r: UserHistoryDto) => r.isVerified ? '✓' : '—' },
    { key: 'createdAt', label: 'Sana', render: (r: UserHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Foydalanuvchilar tarixi" description="Tizim foydalanuvchilari ro'yxati" />
      <FilterBar
        fields={[
          { key: 'phone', placeholder: 'Telefon' },
          { key: 'status', placeholder: 'Status (ACTIVE/BLOCKED)' },
          { key: 'from', placeholder: 'Dan', type: 'date' },
          { key: 'to', placeholder: 'Gacha', type: 'date' },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onSearch={() => { setSearch(filters); setPage(0); }}
        onReset={() => { setFilters(EMPTY_FILTERS); setSearch(EMPTY_FILTERS); setPage(0); }}
      />
      <DataTable columns={columns as never} data={data.content as never} loading={loading} />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPageChange={setPage} />
    </DashboardLayout>
  );
}
