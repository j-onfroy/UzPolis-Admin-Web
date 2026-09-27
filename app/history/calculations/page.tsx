'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { usePagedQuery } from '@/lib/usePagedQuery';
import { CalculationHistoryDto } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY = { gosNumber: '', from: '', to: '' };

export default function HistoryCalculationsPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const { data, loading } = usePagedQuery<CalculationHistoryDto>('/history/calculations', { ...search, page });

  const columns = [
    { key: 'id', label: 'ID', render: (r: CalculationHistoryDto) => <span className="font-mono text-xs text-muted-foreground">#{r.id}</span> },
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: CalculationHistoryDto) => <span className="font-mono font-semibold">{r.gosNumber}</span> },
    { key: 'periodId', label: 'Muddat', render: (r: CalculationHistoryDto) => r.periodId ? `${r.periodId}` : '—' },
    { key: 'amountUzs', label: 'Summa', render: (r: CalculationHistoryDto) => new Intl.NumberFormat('uz-UZ').format(r.amountUzs) + ' so\'m' },
    { key: 'createdAt', label: 'Sana', render: (r: CalculationHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Kalkulyatsiyalar tarixi" />
      <FilterBar
        fields={[
          { key: 'gosNumber', placeholder: 'Davlat raqami' },
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
