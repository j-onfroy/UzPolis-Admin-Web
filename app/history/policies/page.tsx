'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, getErrorMessage } from '@/lib/api';
import { PolicyHistoryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';
import { RefreshCw, Download } from 'lucide-react';

const EMPTY = { gosNumber: '', clientPhone: '', status: '', adminId: '', from: '', to: '' };

function statusVariant(status: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700 hover:bg-green-100';
  if (status === 'ACTIVE') return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
  if (status === 'FAILED' || status === 'CANCELLED') return 'bg-red-100 text-red-700 hover:bg-red-100';
  return '';
}

export default function HistoryPoliciesPage() {
  const [data, setData] = useState<PageResult<PolicyHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: res } = await api.get<PageResult<PolicyHistoryDto>>('/history/policies', { params: { ...search, page, size: 20 } });
      setData(res);
    } catch { } finally { setLoading(false); }
  }

  async function checkPayment(contractId: string) {
    setCheckingId(contractId);
    try {
      const { data: res } = await api.post<{ status?: string }>(`/osago/contracts/${contractId}/confirm`, {});
      if (res.status === 'PAID') {
        toast.success("To'lov tasdiqlandi! Polis saqlandi.");
      } else {
        toast.info("To'lov hali amalga oshmagan.");
      }
      fetchData();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCheckingId(null); }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: PolicyHistoryDto) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'gosNumber', label: 'Davlat raqami', render: (r: PolicyHistoryDto) => <span className="font-mono font-semibold">{r.gosNumber || '—'}</span> },
    {
      key: 'ownerName', label: 'Egasi',
      render: (r: PolicyHistoryDto) => r.ownerName
        ? <span className="text-sm">{r.ownerName}</span>
        : <span className="text-muted-foreground text-xs">—</span>
    },
    { key: 'clientPhone', label: 'Mijoz', render: (r: PolicyHistoryDto) => <span className="font-mono text-sm">{r.clientPhone || '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (r: PolicyHistoryDto) => <Badge className={statusVariant(r.status)}>{r.status}</Badge>
    },
    {
      key: 'policyNumber', label: 'Polis raqami',
      render: (r: PolicyHistoryDto) => (r.policySery || r.policyNumber)
        ? <span className="font-mono text-sm font-medium">{[r.policySery, r.policyNumber].filter(Boolean).join(' ')}</span>
        : <span className="text-muted-foreground text-xs">—</span>
    },
    { key: 'amountUzs', label: 'Summa', render: (r: PolicyHistoryDto) => new Intl.NumberFormat('uz-UZ').format(r.amountUzs) + ' so\'m' },
    {
      key: 'sellerAdminName', label: 'Ro\'yxatlashtirildi',
      render: (r: PolicyHistoryDto) => r.sellerAdminName
        ? <span className="font-medium">{r.sellerAdminName}</span>
        : <span className="text-muted-foreground italic text-xs">Web sayt orqali</span>
    },
    { key: 'createdAt', label: 'Sana', render: (r: PolicyHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
    {
      key: 'actions', label: 'Amallar',
      render: (r: PolicyHistoryDto) => {
        if (r.status === 'PAID') {
          return r.policyFileUrl
            ? (
              <a href={r.policyFileUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5 h-8">
                  <Download size={13} /> Yuklab olish
                </Button>
              </a>
            )
            : <span className="text-muted-foreground text-xs">Fayl yo&apos;q</span>;
        }
        if (r.status === 'ACTIVE' && r.contractId) {
          const id = r.contractId;
          return (
            <Button size="sm" variant="outline" className="gap-1.5 h-8"
              disabled={checkingId === id}
              onClick={() => checkPayment(id)}>
              <RefreshCw size={13} className={checkingId === id ? 'animate-spin' : ''} />
              {checkingId === id ? 'Tekshirilmoqda...' : "To'lovni tekshirish"}
            </Button>
          );
        }
        return <span className="text-muted-foreground text-xs">—</span>;
      }
    },
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
