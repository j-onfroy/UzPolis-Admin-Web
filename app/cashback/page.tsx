'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { CashbackConfigDto } from '@/lib/types';
import { Plus, Percent, Edit } from 'lucide-react';

interface AdminOption {
  id: number;
  fullName: string;
  username: string;
}

const EMPTY_FORM = { adminId: '', ratePercent: '5', insuranceType: 'OSAGO', note: '' };

export default function CashbackPage() {
  const [configs, setConfigs] = useState<CashbackConfigDto[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
    fetchAdmins();
  }, []);

  async function fetchConfigs() {
    setLoading(true);
    try {
      const { data } = await api.get<CashbackConfigDto[]>('/cashback/configs');
      setConfigs(data);
    } catch { } finally { setLoading(false); }
  }

  async function fetchAdmins() {
    try {
      const { data } = await api.get<{ content: AdminOption[] }>('/admins', { params: { size: 200, page: 0 } });
      setAdmins(data.content || []);
    } catch { }
  }

  async function handleToggle(id: number) {
    try {
      await api.patch(`/cashback/configs/${id}/toggle`);
      toast.success('Holat o\'zgartirildi');
      fetchConfigs();
    } catch (err) { toast.error(getErrorMessage(err)); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(config: CashbackConfigDto) {
    setEditingId(config.id);
    setForm({
      adminId: config.adminId ? String(config.adminId) : '',
      ratePercent: String(config.ratePercent),
      insuranceType: config.insuranceType,
      note: config.note || '',
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        adminId: form.adminId ? Number(form.adminId) : null,
        ratePercent: parseFloat(form.ratePercent),
        insuranceType: form.insuranceType,
        note: form.note || null,
      };
      if (editingId) {
        await api.put(`/cashback/configs/${editingId}`, body);
      } else {
        await api.post('/cashback/configs', body);
      }
      toast.success(editingId ? 'Cashback yangilandi' : 'Cashback qo\'shildi');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchConfigs();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  const globalConfig = configs.find(c => !c.adminId);

  const columns = [
    { key: 'id', label: 'ID', render: (r: CashbackConfigDto) => <span className="font-mono text-xs text-muted-foreground">#{r.id}</span> },
    { key: 'adminName', label: 'Admin', render: (r: CashbackConfigDto) => r.adminName || <Badge variant="outline">Global</Badge> },
    { key: 'insuranceType', label: 'Tur', render: (r: CashbackConfigDto) => <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.insuranceType}</code> },
    {
      key: 'ratePercent', label: 'Foiz',
      render: (r: CashbackConfigDto) => <span className="font-bold text-primary">{r.ratePercent}%</span>
    },
    {
      key: 'active', label: 'Holat',
      render: (r: CashbackConfigDto) => (
        <Badge className={r.active ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
          variant={r.active ? 'default' : 'secondary'}>
          {r.active ? 'Aktiv' : 'Nofaol'}
        </Badge>
      )
    },
    {
      key: 'actions', label: '',
      render: (r: CashbackConfigDto) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEdit(r)}>
            <Edit size={13} />
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => handleToggle(r.id)}>
            {r.active ? 'O\'chirish' : 'Yoqish'}
          </Button>
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Cashback boshqaruvi"
        description="Global va admin cashback foizlarini sozlash"
        action={
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus size={16} />
            Qo'shish
          </Button>
        }
      />

      {globalConfig && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Global cashback stavkasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Percent size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{globalConfig.ratePercent}%</p>
                <p className="text-sm text-muted-foreground">{globalConfig.insuranceType} uchun</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable columns={columns as never} data={configs as never} loading={loading} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Cashback tahrirlash' : 'Cashback qo\'shish'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Admin (bo&apos;sh = global barcha adminlar uchun)</Label>
              <select
                value={form.adminId}
                onChange={e => setForm(f => ({ ...f, adminId: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Global (barcha adminlar)</option>
                {admins.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.fullName || a.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Foiz (%)</Label>
              <Input
                type="number"
                step="0.5"
                min="0.01"
                max="99.99"
                value={form.ratePercent}
                onChange={e => setForm(f => ({ ...f, ratePercent: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
