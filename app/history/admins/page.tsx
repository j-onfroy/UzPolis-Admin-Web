'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { api } from '@/lib/api';
import { AdminHistoryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY = { adminId: '', action: '', from: '', to: '' };

export default function HistoryAdminsPage() {
  const [data, setData] = useState<PageResult<AdminHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await api.get<PageResult<AdminHistoryDto>>('/history/admins', { params: { ...search, page, size: 20 } });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: AdminHistoryDto) => <span className="font-mono text-xs text-muted-foreground">#{r.id}</span> },
    { key: 'adminName', label: 'Admin', render: (r: AdminHistoryDto) => <span className="font-medium">{r.adminName}</span> },
    { key: 'action', label: 'Amal', render: (r: AdminHistoryDto) => <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.action}</code> },
    { key: 'details', label: 'Tafsilot', render: (r: AdminHistoryDto) => <span className="text-muted-foreground text-xs max-w-xs truncate block">{r.details || '—'}</span> },
    { key: 'createdAt', label: 'Sana', render: (r: AdminHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Admin amallar tarixi" />
      <FilterBar
        fields={[
          { key: 'adminId', placeholder: 'Admin ID' },
          { key: 'action', placeholder: 'Amal' },
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
