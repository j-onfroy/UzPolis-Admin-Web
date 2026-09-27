'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import { WalletDto, WalletTransactionDto, PageResult } from '@/lib/types';
import { Wallet, ArrowUpDown, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function WalletsPage() {
  const [myWallet, setMyWallet] = useState<WalletDto | null>(null);
  const [myTxns, setMyTxns] = useState<WalletTransactionDto[]>([]);
  const [allWallets, setAllWallets] = useState<WalletDto[]>([]);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ adminId: '', amount: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadAll(); }, []);

  function loadAll() {
    api.get<WalletDto>('/wallets/me').then(r => setMyWallet(r.data)).catch(() => {});
    api.get<PageResult<WalletTransactionDto>>('/wallets/me/transactions', { params: { size: 50 } })
      .then(r => setMyTxns(r.data?.content ?? []))
      .catch(() => {});
    api.get<PageResult<WalletDto>>('/wallets', { params: { size: 100 } })
      .then(r => setAllWallets(r.data?.content ?? []))
      .catch(() => {});
  }

  async function handleCreateWallet() {
    setCreating(true);
    try {
      const { data } = await api.get<WalletDto>('/wallets/me');
      setMyWallet(data);
      toast.success('Hamyon yaratildi');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCreating(false); }
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/wallets/adjust', {
        adminId: Number(adjustForm.adminId),
        amount: parseFloat(adjustForm.amount),
        note: adjustForm.note,
      });
      toast.success('Hamyon yangilandi');
      setAdjustOpen(false);
      loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  function formatAmount(amount?: number) {
    if (!amount) return '0 so\'m';
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  }

  const txnColumns = [
    {
      key: 'type', label: 'Tur',
      render: (r: WalletTransactionDto) => {
        const colors: Record<string, string> = {
          CASHBACK: 'bg-green-100 text-green-700',
          WITHDRAWAL: 'bg-red-100 text-red-700',
          ADJUSTMENT: 'bg-blue-100 text-blue-700',
        };
        return <Badge className={colors[r.type] || ''}>{r.type}</Badge>;
      }
    },
    {
      key: 'amount', label: 'Summa',
      render: (r: WalletTransactionDto) => (
        <span className={r.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {r.amount >= 0 ? '+' : ''}{formatAmount(r.amount)}
        </span>
      )
    },
    { key: 'balanceBefore', label: 'Oldin', render: (r: WalletTransactionDto) => r.balanceBefore != null ? formatAmount(r.balanceBefore) : '—' },
    { key: 'balanceAfter', label: 'Keyin', render: (r: WalletTransactionDto) => r.balanceAfter != null ? formatAmount(r.balanceAfter) : '—' },
    { key: 'note', label: 'Izoh', render: (r: WalletTransactionDto) => r.note || '—' },
    { key: 'createdAt', label: 'Sana', render: (r: WalletTransactionDto) => format(new Date(r.createdAt), 'dd.MM.yyyy HH:mm') },
  ];

  const walletColumns = [
    { key: 'adminId', label: 'Admin ID', render: (r: WalletDto) => `#${r.adminId}` },
    { key: 'adminName', label: 'Admin', render: (r: WalletDto) => <span className="font-medium">{r.adminName || '—'}</span> },
    { key: 'balance', label: 'Balans', render: (r: WalletDto) => <span className="font-bold text-primary">{formatAmount(r.balance)}</span> },
    { key: 'totalEarned', label: 'Jami kirim', render: (r: WalletDto) => formatAmount(r.totalEarned) },
    { key: 'totalWithdrawn', label: 'Jami chiqim', render: (r: WalletDto) => formatAmount(r.totalWithdrawn) },
    { key: 'updatedAt', label: 'Yangilangan', render: (r: WalletDto) => r.updatedAt ? format(new Date(r.updatedAt), 'dd.MM.yyyy') : '—' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Hamyonlar"
        description="Admin hamyonlari va tranzaksiyalar"
        action={
          <Button onClick={() => setAdjustOpen(true)} size="sm" variant="outline" className="gap-2">
            <ArrowUpDown size={16} />
            Tuzatish
          </Button>
        }
      />

      <Tabs defaultValue="my">
        <TabsList className="mb-6">
          <TabsTrigger value="my">Mening hamyonim</TabsTrigger>
          <TabsTrigger value="all">Barcha hamyonlar</TabsTrigger>
        </TabsList>

        <TabsContent value="my">
          {myWallet ? (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Wallet size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joriy balans</p>
                      <p className="text-3xl font-bold">{formatAmount(myWallet.balance)}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground space-y-1">
                    <p>Jami kirim: <span className="text-green-600 font-semibold">{formatAmount(myWallet.totalEarned)}</span></p>
                    <p>Jami chiqim: <span className="text-red-600 font-semibold">{formatAmount(myWallet.totalWithdrawn)}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-dashed">
              <CardContent className="p-8 text-center">
                <Wallet size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Sizda hali hamyon yo&apos;q. Sug&apos;urta sotish uchun hamyon yarating.</p>
                <Button onClick={handleCreateWallet} disabled={creating} className="gap-2">
                  <Plus size={16} />
                  {creating ? 'Yaratilmoqda...' : 'Hamyon yaratish'}
                </Button>
              </CardContent>
            </Card>
          )}
          <DataTable columns={txnColumns as never} data={myTxns as never} emptyMessage="Tranzaksiyalar yo'q" />
        </TabsContent>

        <TabsContent value="all">
          <DataTable columns={walletColumns as never} data={allWallets as never} emptyMessage="Hamyonlar topilmadi" />
        </TabsContent>
      </Tabs>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hamyon tuzatish</DialogTitle></DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label>Admin ID</Label>
              <Input type="number" value={adjustForm.adminId} onChange={e => setAdjustForm(f => ({ ...f, adminId: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Summa (manfiy — ayirish)</Label>
              <Input type="number" step="1000" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Izoh</Label>
              <Input value={adjustForm.note} onChange={e => setAdjustForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={saving}>{saving ? '...' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
