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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import { PolicyHistoryDto, PolicySummaryDto, PageResult } from '@/lib/types';
import { format } from 'date-fns';
import { RefreshCw, Download, Info, FileText } from 'lucide-react';

const EMPTY = { gosNumber: '', clientPhone: '', status: '', adminId: '', from: '', to: '' };

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'PAID — to\'langan' },
  { value: 'ACTIVE', label: 'ACTIVE — to\'lov kutilmoqda' },
  { value: 'FAILED', label: 'FAILED — xatolik' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

function statusVariant(status: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700 hover:bg-green-100';
  if (status === 'ACTIVE') return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
  if (status === 'FAILED' || status === 'CANCELLED') return 'bg-red-100 text-red-700 hover:bg-red-100';
  return '';
}

function fmt(n?: number | null) {
  if (!n) return "0 so'm";
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

function periodLabel(periodId?: number) {
  if (periodId === 1) return '12 oy';
  if (periodId === 2) return '6 oy';
  return '—';
}

export default function HistoryPoliciesPage() {
  const [data, setData] = useState<PageResult<PolicyHistoryDto>>({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
  const [summary, setSummary] = useState<PolicySummaryDto | null>(null);
  const [filters, setFilters] = useState(EMPTY);
  const [search, setSearch] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PolicyHistoryDto | null>(null);

  useEffect(() => { fetchData(); }, [page, search]);

  async function fetchData() {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get<PageResult<PolicyHistoryDto>>('/history/policies', { params: { ...search, page, size: 20 } }),
        api.get<PolicySummaryDto>('/history/policies/summary', { params: { ...search } }),
      ]);
      setData(listRes.data);
      setSummary(sumRes.data);
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
    { key: 'amountUzs', label: 'Summa', render: (r: PolicyHistoryDto) => fmt(r.amountUzs) },
    {
      key: 'sellerAdminName', label: 'Ro\'yxatlashtirildi',
      render: (r: PolicyHistoryDto) => r.sellerAdminName
        ? <span className="font-medium">{r.sellerAdminName}</span>
        : <span className="text-muted-foreground italic text-xs">Web sayt orqali</span>
    },
    { key: 'createdAt', label: 'Sana', render: (r: PolicyHistoryDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
    {
      key: 'actions', label: 'Amallar',
      render: (r: PolicyHistoryDto) => (
        <div className="flex items-center gap-1.5">
          {r.status === 'ACTIVE' && r.contractId && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8"
              disabled={checkingId === r.contractId}
              onClick={() => checkPayment(r.contractId!)}>
              <RefreshCw size={13} className={checkingId === r.contractId ? 'animate-spin' : ''} />
              {checkingId === r.contractId ? '...' : 'Tekshirish'}
            </Button>
          )}
          {r.status === 'PAID' && r.policyFileUrl && (
            <a href={r.policyFileUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 h-8">
                <Download size={13} /> Yuklab olish
              </Button>
            </a>
          )}
          <Button size="sm" variant="ghost" className="gap-1.5 h-8" onClick={() => setDetail(r)}>
            <Info size={13} /> Batafsil
          </Button>
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Polislar tarixi" description="Barcha OSAGO polislari" />
      <FilterBar
        fields={[
          { key: 'gosNumber', placeholder: 'Davlat raqami' },
          { key: 'clientPhone', placeholder: 'Mijoz telefoni' },
          { key: 'status', placeholder: 'Barcha statuslar', type: 'select', options: STATUS_OPTIONS },
          { key: 'from', placeholder: 'Dan', type: 'date' },
          { key: 'to', placeholder: 'Gacha', type: 'date' },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onSearch={() => { setSearch(filters); setPage(0); }}
        onReset={() => { setFilters(EMPTY); setSearch(EMPTY); setPage(0); }}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-40 rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Umumiy soni</p>
          <p className="text-lg font-bold">{summary?.count ?? data.totalElements} ta</p>
        </div>
        <div className="flex-1 min-w-40 rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Umumiy summa</p>
          <p className="text-lg font-bold text-primary">{fmt(summary?.totalAmount)}</p>
        </div>
      </div>

      <DataTable columns={columns as never} data={data.content as never} loading={loading} />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPageChange={setPage} />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={18} /> Polis ma&apos;lumotlari
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-2.5 text-sm">
              <Row label="Status" value={<Badge className={statusVariant(detail.status)}>{detail.status}</Badge>} />
              <Row label="Davlat raqami" value={<span className="font-mono font-semibold">{detail.gosNumber || '—'}</span>} />
              <Row label="Avtomobil" value={[detail.markaName, detail.modelName].filter(Boolean).join(' ') || '—'} />
              <Row label="Egasi" value={detail.ownerName || '—'} />
              <Row label="Mijoz telefoni" value={<span className="font-mono">{detail.clientPhone || '—'}</span>} />
              <Row label="Polis turi" value={detail.limited == null ? '—' : (detail.limited ? 'Cheklangan' : 'Cheklanmagan')} />
              <Row label="Muddat" value={periodLabel(detail.periodId)} />
              <Row label="Summa" value={<span className="font-semibold">{fmt(detail.amountUzs)}</span>} />
              {detail.startDate && <Row label="Boshlanish sanasi" value={detail.startDate} />}
              <Row label="Yaratilgan" value={format(new Date(detail.createdAt), 'dd.MM.yyyy HH:mm')} />

              {detail.status === 'PAID' && (
                <>
                  <Row label="Polis raqami" value={<span className="font-mono">{[detail.policySery, detail.policyNumber].filter(Boolean).join(' ') || '—'}</span>} />
                  {detail.policyFileUrl && (
                    <a href={detail.policyFileUrl} target="_blank" rel="noreferrer" className="block pt-1">
                      <Button variant="outline" className="w-full gap-2">
                        <Download size={15} /> Polisni yuklab olish
                      </Button>
                    </a>
                  )}
                </>
              )}

              {detail.status === 'FAILED' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-1">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Xatolik sababi</p>
                  <p className="text-sm text-red-600">{detail.failureReason || "Noma'lum sabab"}</p>
                </div>
              )}

              {detail.status === 'ACTIVE' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-blue-700">To&apos;lov hali amalga oshmagan</p>
                  {detail.contractId && (
                    <Button size="sm" variant="outline" className="gap-1.5 h-8"
                      disabled={checkingId === detail.contractId}
                      onClick={() => checkPayment(detail.contractId!)}>
                      <RefreshCw size={13} className={checkingId === detail.contractId ? 'animate-spin' : ''} />
                      To&apos;lovni tekshirish
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
