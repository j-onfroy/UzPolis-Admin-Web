'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { api } from '@/lib/api';
import { VehicleHistoryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';

const EMPTY = { gosNumber: '', markaName: '', from: '', to: '' };

export default function HistoryVehiclesPage() {
  const [data, setData] = useState<PageResult<VehicleHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await api.get<PageResult<VehicleHistoryDto>>('/history/vehicles', { params: { ...search, page, size: 20 } });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  function safeDate(val: string | undefined) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : format(d, 'dd.MM.yyyy HH:mm');
  }

  const columns = [
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: VehicleHistoryDto) => <span className="font-mono font-semibold">{r.gosNumber}</span> },
    { key: 'markaName', label: 'Marka', render: (r: VehicleHistoryDto) => r.markaName || '—' },
    { key: 'modelName', label: 'Model', render: (r: VehicleHistoryDto) => r.modelName || '—' },
    { key: 'ownerName', label: 'Egasi', render: (r: VehicleHistoryDto) => r.ownerName || '—' },
    { key: 'ownerPinfl', label: 'PINFL', render: (r: VehicleHistoryDto) => r.ownerPinfl ? `${r.ownerPinfl.slice(0, 3)}*****${r.ownerPinfl.slice(-4)}` : '—' },
    { key: 'checkCount', label: "So'rovlar", render: (r: VehicleHistoryDto) => r.checkCount ?? '—' },
    { key: 'lastCheckedAt', label: 'Sana', render: (r: VehicleHistoryDto) => safeDate(r.lastCheckedAt) },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Avtomobillar tarixi" />
      <FilterBar
        fields={[
          { key: 'gosNumber', placeholder: 'Davlat raqami' },
          { key: 'markaName', placeholder: 'Marka' },
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
