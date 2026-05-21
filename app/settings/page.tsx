'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { User, ShieldCheck, Calendar, MapPin, CreditCard, Phone, Hash, Globe } from 'lucide-react';

interface AdminMeDto {
  id: number;
  username: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  roleName: string;
  roleDisplayName: string;
  verified: boolean;
  pinfl?: string;
  passportSeries?: string;
  passportNumber?: string;
  birthdate?: string;
  address?: string;
  gender?: string;
  nationality?: string;
  lastLogin?: string;
  createdAt?: string;
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      {icon && <div className="w-5 mt-0.5 text-muted-foreground flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function maskPinfl(pinfl?: string) {
  if (!pinfl) return undefined;
  return pinfl.slice(0, 4) + '*****' + pinfl.slice(-3);
}

function formatDate(d?: string) {
  if (!d) return undefined;
  try {
    return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
}

function formatDatetime(d?: string) {
  if (!d) return undefined;
  try {
    return new Date(d).toLocaleString('uz-UZ');
  } catch { return d; }
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AdminMeDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AdminMeDto>('/admins/me')
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <PageHeader title="Mening profilim" description="Shaxsiy ma'lumotlar" />

      <div className="max-w-xl space-y-5">

        {profile && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            profile.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <ShieldCheck size={22} className={profile.verified ? 'text-green-600' : 'text-amber-500'} />
            <div>
              <p className={`text-sm font-semibold ${profile.verified ? 'text-green-700' : 'text-amber-700'}`}>
                {profile.verified ? 'Shaxsiyat tasdiqlangan' : 'Shaxsiyat tasdiqlanmagan'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.verified ? 'Pasport ma\'lumotlari tekshirildi' : 'Tasdiqlash uchun tizimga kiring'}
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={16} />
              Ma&apos;lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
              </div>
            ) : (
              <>
                <InfoRow label="To'liq ism" value={profile?.fullName} icon={<User size={14} />} />
                <InfoRow label="Telefon" value={profile?.phoneNumber} icon={<Phone size={14} />} />
                <InfoRow label="Rol" value={profile?.roleDisplayName || profile?.roleName} icon={<ShieldCheck size={14} />} />
                <InfoRow label="Holat" value={profile?.status === 'ACTIVE' ? 'Faol' : profile?.status} />
                <InfoRow label="PINFL" value={maskPinfl(profile?.pinfl)} icon={<Hash size={14} />} />
                <InfoRow
                  label="Hujjat seriyasi"
                  value={profile?.passportSeries && profile?.passportNumber
                    ? `${profile.passportSeries} ${profile.passportNumber}` : undefined}
                  icon={<CreditCard size={14} />}
                />
                <InfoRow label="Tug'ilgan sana" value={formatDate(profile?.birthdate)} icon={<Calendar size={14} />} />
                {profile?.gender && (
                  <InfoRow
                    label="Jinsi"
                    value={profile.gender === 'MALE' ? 'Erkak' : profile.gender === 'FEMALE' ? 'Ayol' : profile.gender}
                  />
                )}
                <InfoRow label="Millat / fuqarolik" value={profile?.nationality} icon={<Globe size={14} />} />
                <InfoRow label="Manzil" value={profile?.address} icon={<MapPin size={14} />} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tizim</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-0 pt-0">
            <InfoRow label="Admin ID" value={profile ? `#${profile.id}` : undefined} />
            <InfoRow label="Login" value={profile?.username} />
            <InfoRow label="Oxirgi kirish" value={formatDatetime(profile?.lastLogin)} />
            <InfoRow label="Ro'yxatdan o'tgan" value={formatDatetime(profile?.createdAt)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
