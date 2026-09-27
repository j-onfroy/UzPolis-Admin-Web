'use client';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, getErrorMessage } from '@/lib/api';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PendingSale {
  id?: number;
  contractId?: string;
  gosNumber?: string;
  clientPhone?: string;
  amountUzs?: number;
  cashbackAmount?: number;
  paymeUrl?: string;
  clickUrl?: string;
  createdAt?: string;
  status?: string;
}

interface ContractResult {
  status?: string;
  [key: string]: unknown;
}

function fmt(n?: number | null) {
  if (!n) return "0 so'm";
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

export default function PendingPaymentsPage() {
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PendingSale[]>('/osago/pending-sales');
      setSales(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
  useEffect(() => { loadSales(); }, [loadSales]);

  async function checkPayment(contractId: string) {
    setCheckingId(contractId);
    try {
      const { data } = await api.post<ContractResult>(`/osago/pending-sales/${contractId}/check`, {});
      if (data.status === 'PAID') {
        toast.success("To'lov tasdiqlandi! Cashback hamyoningizga tushdi.");
        loadSales();
      } else {
        toast.info("To'lov hali amalga oshmagan. Mijoz to'lovni bajarmagan.");
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCheckingId(null); }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Jarayondagi To'lovlar"
        description="To'lov kutilayotgan OSAGO polislari"
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {!loading && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              {sales.length} ta kutilmoqda
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadSales} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw size={20} className="animate-spin mr-2" />
          Yuklanmoqda...
        </div>
      )}

      {!loading && sales.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <CheckCircle size={40} className="text-green-400" />
          <p className="text-sm">Jarayondagi to&apos;lovlar yo&apos;q</p>
          <p className="text-xs">Barcha to&apos;lovlar amalga oshirilgan</p>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="space-y-4 max-w-2xl">
          {sales.map(sale => (
            <Card key={sale.id ?? sale.contractId} className="border-amber-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500 flex-shrink-0" />
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                        To&apos;lov kutilmoqda
                      </Badge>
                    </div>

                    <p className="font-mono font-bold text-lg">{sale.gosNumber || '—'}</p>
                    <p className="text-sm text-muted-foreground">{sale.clientPhone || '—'}</p>
                    <p className="text-xl font-bold text-primary">{fmt(sale.amountUzs)}</p>

                    {sale.cashbackAmount && sale.cashbackAmount > 0 && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Cashback: {fmt(sale.cashbackAmount)}
                      </p>
                    )}

                    {sale.contractId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {sale.contractId}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleString('uz-UZ') : ''}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
                    {sale.paymeUrl && (
                      <a href={sale.paymeUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-[#00A4D6] hover:bg-[#0090bc] text-white gap-1.5 w-full">
                          <ExternalLink size={12} />
                          Payme
                        </Button>
                      </a>
                    )}
                    {sale.clickUrl && (
                      <a href={sale.clickUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-[#1B2A47] hover:bg-[#152038] text-white gap-1.5 w-full">
                          <ExternalLink size={12} />
                          Click
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 w-full"
                      disabled={checkingId === sale.contractId}
                      onClick={() => sale.contractId && checkPayment(sale.contractId)}
                    >
                      <RefreshCw size={12} className={checkingId === sale.contractId ? 'animate-spin' : ''} />
                      {checkingId === sale.contractId ? 'Tekshirilmoqda...' : "To'lovni tekshirish"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 max-w-2xl">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Mijoz to&apos;lovni Payme yoki Click orqali amalga oshirganidan so&apos;ng
            <strong> &quot;To&apos;lovni tekshirish&quot;</strong> tugmasini bosing.
            To&apos;lov tasdiqlanganda cashback avtomatik hamyoningizga o&apos;tkaziladi.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
