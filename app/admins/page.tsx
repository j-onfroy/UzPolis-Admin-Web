'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { api, getErrorMessage } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { handlePhoneInput, normalizePhone, isValidPhone } from '@/lib/utils';
import { UserPlus, ShieldAlert, MessageSquare, Trash2 } from 'lucide-react';

interface AdminRow {
  id: number; fullName: string; phoneNumber: string;
  role: { name: string; displayName: string };
  status: string; verified?: boolean; lastLogin?: string; createdAt: string;
}
interface Role { id: number; name: string; displayName: string; }
interface CreateForm { fullName: string; phoneNumber: string; roleId: string; }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>({ fullName: '', phoneNumber: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [smsSending, setSmsSending] = useState<number | null>(null);

  // Delete flow
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchAdmins();
    api.get<Role[]>('/roles').then(r => setRoles(r.data)).catch(() => {});
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const { data } = await api.get<{ content: AdminRow[] }>('/admins');
      const list = Array.isArray(data) ? data : (data as { content: AdminRow[] }).content ?? [];
      setAdmins(list);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(form.phoneNumber)) { toast.error("Telefon raqamini to'g'ri kiriting (+998XXXXXXXXX)"); return; }
    setSaving(true);
    try {
      await api.post('/admins', {
        fullName: form.fullName,
        phoneNumber: normalizePhone(form.phoneNumber),
        roleId: Number(form.roleId),
      });
      toast.success(`${form.fullName} qo'shildi. SMS parol yuborildi.`);
      setAddOpen(false);
      setForm({ fullName: '', phoneNumber: '', roleId: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRequest(admin: AdminRow) {
    setDeleteTarget(admin);
    setDeleteStep(1);
    setDeleteCode('');
    setDeleteLoading(true);
    try {
      await api.post(`/admins/${admin.id}/request-delete`);
      setDeleteStep(2);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !deleteCode.trim()) return;
    setDeleteLoading(true);
    try {
      await api.post(`/admins/${deleteTarget.id}/confirm-delete`, { code: deleteCode.trim() });
      toast.success(`${deleteTarget.fullName} o'chirildi`);
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleDeleteClose() {
    setDeleteTarget(null);
    setDeleteCode('');
    setDeleteStep(1);
  }

  async function handleResendSms(admin: AdminRow) {
    setSmsSending(admin.id);
    try {
      await api.post(`/admins/${admin.id}/resend-sms`);
      toast.success(`${admin.fullName} ga yangi parol bilan SMS yuborildi`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSmsSending(null);
    }
  }

  async function handleBlock(admin: AdminRow) {
    const shouldBlock = admin.status === 'ACTIVE';
    try {
      await api.patch(`/admins/${admin.id}/block`, { blocked: shouldBlock });
      toast.success(shouldBlock ? 'Admin bloklandi' : 'Admin aktivlashtirildi');
      fetchAdmins();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r: AdminRow) => <span className="font-mono text-xs text-muted-foreground">#{r.id}</span> },
    {
      key: 'fullName', label: 'Ism Familiya',
      render: (r: AdminRow) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.fullName}</span>
          {!r.verified && (
            <span title="Tasdiqlanmagan">
              <ShieldAlert size={14} className="text-amber-500" />
            </span>
          )}
        </div>
      )
    },
    { key: 'phoneNumber', label: 'Telefon', render: (r: AdminRow) => <span className="font-mono text-sm">{r.phoneNumber}</span> },
    {
      key: 'role', label: 'Rol',
      render: (r: AdminRow) => (
        <Badge variant={r.role.name === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
          {r.role.displayName || r.role.name}
        </Badge>
      )
    },
    {
      key: 'status', label: 'Holat',
      render: (r: AdminRow) => {
        const isActive = r.status === 'ACTIVE';
        return (
          <Badge
            variant={isActive ? 'default' : 'destructive'}
            className={isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
          >
            {isActive ? 'Aktiv' : r.status === 'BLOCKED' ? 'Bloklangan' : r.status}
          </Badge>
        );
      }
    },
    {
      key: 'verified', label: 'Tasdiqlangan',
      render: (r: AdminRow) => r.verified
        ? <span className="text-green-600 text-xs font-medium">✓ Ha</span>
        : <span className="text-amber-600 text-xs font-medium">⌛ Yo'q</span>
    },
    {
      key: 'actions', label: '',
      render: (r: AdminRow) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handleBlock(r)}>
            {r.status === 'ACTIVE' ? 'Bloklash' : 'Aktivlash'}
          </Button>
          {!r.lastLogin && (
            <Button
              size="sm"
              variant="outline"
              disabled={smsSending === r.id}
              onClick={() => handleResendSms(r)}
              title="SMS qayta yuborish (yangi parol bilan)"
            >
              <MessageSquare size={14} className="mr-1" />
              {smsSending === r.id ? 'Yuborilmoqda...' : 'SMS'}
            </Button>
          )}
          {isSuperAdmin && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteRequest(r)}
              title="Adminni o'chirish"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Adminlar"
        description="Tizim adminlarini boshqarish — faqat super admin admin qo'sha oladi"
        action={
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2">
            <UserPlus size={16} />
            Admin qo'shish
          </Button>
        }
      />

      <DataTable columns={columns as never} data={admins as never} loading={loading} emptyMessage="Adminlar topilmadi" />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Yangi admin qo'shish</DialogTitle>
            <DialogDescription>
              Admin qo'shilgach uning telefoniga parol va kirish ma'lumotlari SMS orqali yuboriladi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Ism Familiya</Label>
              <Input
                placeholder="Abdullayev Abdulla"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon raqam</Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="+998901234567"
                value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: handlePhoneInput(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.roleId} onValueChange={v => setForm(f => ({ ...f, roleId: v ?? '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {roles.length > 0
                    ? roles.map(r => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.displayName || r.name}</SelectItem>
                      ))
                    : (
                        <>
                          <SelectItem value="2">Sotuv Admin</SelectItem>
                          <SelectItem value="1">Super Admin</SelectItem>
                        </>
                      )
                  }
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={saving || !form.roleId}>
                {saving ? 'Qo\'shilmoqda...' : 'Qo\'shish va SMS yuborish'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && handleDeleteClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 size={18} />
              Adminni o'chirish
            </DialogTitle>
          </DialogHeader>

          {deleteStep === 1 ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{deleteTarget?.fullName}</span> ni
                o'chirmoqchisiz. Telegram kanaliga tasdiqlash kodi yuborilmoqda...
              </p>
              {deleteLoading && (
                <p className="text-xs text-muted-foreground animate-pulse">Kod yuborilmoqda...</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Telegram kanalga yuborilgan <span className="font-semibold">6 raqamli kodni</span> yoki{' '}
                <span className="font-mono font-semibold">delete</span> so'zini kiriting.
              </p>
              <Input
                placeholder="Kod yoki 'delete'"
                value={deleteCode}
                onChange={e => setDeleteCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDeleteConfirm()}
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={handleDeleteClose}>Bekor</Button>
                <Button
                  variant="destructive"
                  disabled={deleteLoading || !deleteCode.trim()}
                  onClick={handleDeleteConfirm}
                >
                  {deleteLoading ? 'O\'chirilmoqda...' : 'Tasdiqlash va o\'chirish'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
