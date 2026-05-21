'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { setAuth } from '@/lib/auth';

type Step = 'credentials' | 'otp' | 'verify-identity';

interface LoginRes { step_token: string; phone_masked: string; }
interface TokenRes {
  access_token: string;
  refresh_token: string;
  needs_verification: boolean;
  admin: { id: number; full_name: string; phone: string; role: { name: string }; verified: boolean; permissions: string[] };
}

const STEPS = ['credentials', 'otp', 'verify-identity'] as const;

function StepDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[0, 1, 2].map(i => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${
          i < idx ? 'w-6 bg-green-500' : i === idx ? 'w-8 bg-primary' : 'w-4 bg-muted'
        }`} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [stepToken, setStepToken] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [otp, setOtp] = useState('');
  const [passportSeries, setPassportSeries] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: res } = await api.post<LoginRes>('/auth/login', { phone, password });
      setStepToken(res.step_token);
      setPhoneMasked(res.phone_masked);
      toast.success('SMS kod yuborildi');
      setStep('otp');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: res } = await api.post<TokenRes>('/auth/verify-otp', {
        step_token: stepToken,
        otp_code: otp,
      });

      setAuth(res.access_token, {
        id: res.admin.id,
        phone: res.admin.phone,
        name: res.admin.full_name,
        role: res.admin.role.name,
        active: true,
        verified: res.admin.verified,
      } as never, res.refresh_token);

      if (res.needs_verification) {
        toast.info('Iltimos, shaxsingizni tasdiqlang');
        setStep('verify-identity');
      } else {
        toast.success(`Xush kelibsiz, ${res.admin.full_name}!`);
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyIdentity(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-identity', {
        passportSeries,
        passportNumber,
        birthDate,
      });
      toast.success('Shaxs tasdiqlandi! Xush kelibsiz!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Step, string> = {
    'credentials': 'Tizimga kirish',
    'otp': 'SMS tasdiqlash',
    'verify-identity': 'Shaxsni tasdiqlash',
  };
  const descs: Record<Step, string> = {
    'credentials': 'Telefon va parolingizni kiriting',
    'otp': `${phoneMasked} raqamiga yuborilgan kodni kiriting`,
    'verify-identity': 'Pasport seriya, raqam va tug\'ilgan sanangizni kiriting',
  };

  const identityValid = passportSeries.length >= 2 && passportNumber.length >= 7 && birthDate.length === 10;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">UzPolis Admin</h1>
            <p className="text-xs text-muted-foreground">Boshqaruv paneli</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <StepDots current={step} />
            <CardTitle className="text-base">{titles[step]}</CardTitle>
            <CardDescription className="text-sm">{descs[step]}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">

            {step === 'credentials' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqami</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998901234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Parol</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Parolingiz"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Tekshirilmoqda...' : 'Davom etish'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">SMS kod</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required
                    autoFocus
                    className="text-center text-2xl tracking-[0.6em] font-mono h-14"
                  />
                  <p className="text-xs text-muted-foreground text-center">Kod 5 daqiqa amal qiladi</p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                  {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
                </Button>
                <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setStep('credentials')}>
                  Orqaga
                </Button>
              </form>
            )}

            {step === 'verify-identity' && (
              <form onSubmit={handleVerifyIdentity} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-2">
                  Bu birinchi kirish. Shaxsingizni bir marta tasdiqlang — keyingi kirishlarda so&apos;ralmaydi.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ps">Hujjat seriyasi</Label>
                    <Input
                      id="ps"
                      placeholder="AA"
                      value={passportSeries}
                      onChange={e => setPassportSeries(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
                      maxLength={2}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pn">Hujjat raqami</Label>
                    <Input
                      id="pn"
                      type="text"
                      inputMode="numeric"
                      placeholder="1234567"
                      value={passportNumber}
                      onChange={e => setPassportNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                      maxLength={7}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bd">Tug&apos;ilgan sana</Label>
                  <Input
                    id="bd"
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !identityValid}
                >
                  <CheckCircle size={16} />
                  {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash va kirish'}
                </Button>
              </form>
            )}

          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Muammo bo&apos;lsa super admin bilan bog&apos;laning
        </p>
      </div>
    </div>
  );
}
