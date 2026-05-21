'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { ShieldCheck, Plus, Trash2, Edit, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface PermissionDto {
  id: number;
  code: string;
  module: string;
  action: string;
  description: string;
}

interface RoleDto {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  permissions: PermissionDto[];
}

function groupByModule(perms: PermissionDto[]) {
  const map: Record<string, PermissionDto[]> = {};
  for (const p of perms) {
    if (!map[p.module]) map[p.module] = [];
    map[p.module].push(p);
  }
  return map;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPerms, setAllPerms] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [editPerms, setEditPerms] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', displayName: '', description: '' });
  const [newRolePerms, setNewRolePerms] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get<RoleDto[]>('/roles'),
        api.get<PermissionDto[]>('/permissions'),
      ]);
      setRoles(rolesRes.data);
      setAllPerms(permsRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(role: RoleDto) {
    setEditingRole(role);
    setEditPerms(new Set(role.permissions.map(p => p.id)));
    setExpandedRole(role.id);
  }

  function cancelEdit() {
    setEditingRole(null);
    setEditPerms(new Set());
  }

  async function savePermissions() {
    if (!editingRole) return;
    setSaving(true);
    try {
      await api.put(`/roles/${editingRole.id}/permissions`, {
        permission_ids: Array.from(editPerms),
      });
      toast.success('Ruxsatlar yangilandi');
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(id: number) {
    if (!confirm('Bu rolni o\'chirishni tasdiqlaysizmi?')) return;
    setDeleting(id);
    try {
      await api.delete(`/roles/${id}`);
      toast.success('Rol o\'chirildi');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/roles', {
        name: newRole.name.toUpperCase().replace(/\s+/g, '_'),
        displayName: newRole.displayName,
        description: newRole.description || undefined,
        permissionIds: Array.from(newRolePerms),
      });
      toast.success("Rol yaratildi");
      setShowCreate(false);
      setNewRole({ name: '', displayName: '', description: '' });
      setNewRolePerms(new Set());
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const permsByModule = groupByModule(allPerms);

  function PermissionMatrix({ selected, onChange }: { selected: Set<number>; onChange: (s: Set<number>) => void }) {
    return (
      <div className="space-y-4 mt-3">
        {Object.entries(permsByModule).map(([module, perms]) => {
          const allSelected = perms.every(p => selected.has(p.id));
          const someSelected = perms.some(p => selected.has(p.id));
          return (
            <div key={module} className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(selected);
                    if (allSelected) perms.forEach(p => next.delete(p.id));
                    else perms.forEach(p => next.add(p.id));
                    onChange(next);
                  }}
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    allSelected ? 'bg-primary border-primary' : someSelected ? 'bg-primary/40 border-primary/60' : 'border-border'
                  }`}
                >
                  {(allSelected || someSelected) && <Check size={10} className="text-white" />}
                </button>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{module}</span>
              </div>
              <div className="divide-y">
                {perms.map(p => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/20">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={e => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
                        onChange(next);
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{p.code}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">{p.action}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Rol boshqaruvi"
        description="Rollar va ruxsatlarni boshqarish"
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} />
            Yangi rol
          </Button>
        }
      />

      {/* Create role form */}
      {showCreate && (
        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus size={16} />
              Yangi rol yaratish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol nomi (kod)</Label>
                  <Input placeholder="EXAMPLE_ROLE" value={newRole.name}
                    onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))} required />
                  <p className="text-xs text-muted-foreground">Avtomatik UPPER_SNAKE_CASE ga o&apos;tkaziladi</p>
                </div>
                <div className="space-y-2">
                  <Label>Ko&apos;rsatish nomi</Label>
                  <Input placeholder="Example Role" value={newRole.displayName}
                    onChange={e => setNewRole(r => ({ ...r, displayName: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tavsif (ixtiyoriy)</Label>
                <Input placeholder="Bu rol uchun tavsif..." value={newRole.description}
                  onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))} />
              </div>
              <div>
                <Label>Ruxsatlar</Label>
                <PermissionMatrix selected={newRolePerms} onChange={setNewRolePerms} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setNewRolePerms(new Set()); }}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Yaratilmoqda...' : 'Yaratish'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map(role => {
            const isExpanded = expandedRole === role.id;
            const isEditing = editingRole?.id === role.id;
            return (
              <Card key={role.id} className={isEditing ? 'border-primary/30' : ''}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => !isEditing && setExpandedRole(isExpanded ? null : role.id)}
                >
                  <ShieldCheck size={18} className={role.isSystem ? 'text-primary' : 'text-muted-foreground'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{role.displayName}</span>
                      {role.isSystem && (
                        <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">Tizim</Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{role.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{role.permissions.length} ta ruxsat</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {!isEditing ? (
                      <>
                        <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => startEdit(role)}>
                          <Edit size={13} />
                          Ruxsatlar
                        </Button>
                        {!role.isSystem && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive hover:text-destructive"
                            disabled={deleting === role.id}
                            onClick={() => deleteRole(role.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="h-8" onClick={cancelEdit}>Bekor</Button>
                        <Button size="sm" className="h-8" disabled={saving} onClick={savePermissions}>
                          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </Button>
                      </>
                    )}
                    {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 border-t">
                    {isEditing ? (
                      <>
                        <p className="text-xs text-muted-foreground mt-3 mb-1">
                          {role.name === 'SUPER_ADMIN' ? 'SUPER_ADMIN ruxsatlarini o\'zgartirish mumkin emas' : 'Ruxsatlarni belgilang:'}
                        </p>
                        <PermissionMatrix selected={editPerms} onChange={setEditPerms} />
                      </>
                    ) : (
                      <div className="mt-3">
                        {role.permissions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Hech qanday ruxsat yo&apos;q</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map(p => (
                              <Badge key={p.id} variant="secondary" className="text-xs font-mono">
                                {p.code}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
