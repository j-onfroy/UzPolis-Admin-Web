'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, CheckCircle, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { handlePhoneInput, normalizePhone } from '@/lib/utils';

type Step = 'phone' | 'otp' | 'passport';

const STEPS: Step[] = ['phone', 'otp', 'passport'];

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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [passportSeries, setPassportSeries] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin-onboarding/request-otp', { phoneNumber: normalizePhone(phone) });
      toast.success('SMS kod yuborildi');
      setStep('otp');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleOtpNext(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('6 raqamli kodni to\'liq kiriting');
      return;
    }
    setStep('passport');
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Parollar mos kelmayapti');
      return;
    }
    if (password.length < 8) {
      toast.error('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin-onboarding/complete', {
        phoneNumber: normalizePhone(phone),
        otp,
        passportSeries,
        passportNumber,
        birthdate,
        password,
      });
      toast.success('Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi!');
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Step, string> = {
    phone: 'Ro\'yxatdan o\'tish',
    otp: 'SMS tasdiqlash',
    passport: 'Shaxs ma\'lumotlari',
  };
  const descs: Record<Step, string> = {
    phone: 'Sizga yuborilgan taklif telefon raqamini kiriting',
    otp: 'Telefon raqamingizga yuborilgan kodni kiriting',
    passport: 'Hujjat ma\'lumotlari va yangi parol kiriting',
  };

  const passportValid =
    passportSeries.length >= 2 &&
    passportNumber.length >= 7 &&
    birthdate.length === 10 &&
    password.length >= 8 &&
    password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">UzPolis Admin</h1>
            <p className="text-xs text-muted-foreground">Admin ro&apos;yxatdan o&apos;tish</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <StepDots current={step} />
            <CardTitle className="text-base">{titles[step]}</CardTitle>
            <CardDescription className="text-sm">{descs[step]}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">

            {step === 'phone' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} />
                    <span>Faqat super admin tomonidan taklif qilingan raqamlar ro&apos;yxatdan o&apos;ta oladi</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqami</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={e => setPhone(handlePhoneInput(e.target.value))}
                    required
                    autoFocus
                    maxLength={13}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Yuborilmoqda...' : 'SMS kod olish'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => router.push('/login')}
                >
                  Tizimga kirish
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOtpNext} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={otp.length < 6}>
                  Davom etish
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setStep('phone')}
                >
                  Orqaga
                </Button>
              </form>
            )}

            {step === 'passport' && (
              <form onSubmit={handleComplete} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>Pasport ma&apos;lumotlari Insonline.uz orqali tekshiriladi</span>
                  </div>
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
                    value={birthdate}
                    onChange={e => setBirthdate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pw">Yangi parol</Label>
                  <div className="relative">
                    <Input
                      id="pw"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Kamida 8 belgi"
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

                <div className="space-y-2">
                  <Label htmlFor="cpw">Parolni tasdiqlang</Label>
                  <Input
                    id="cpw"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Parolni qaytadan kiriting"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Parollar mos kelmayapti</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !passportValid}
                >
                  <CheckCircle size={16} />
                  {loading ? 'Tekshirilmoqda...' : 'Ro\'yxatdan o\'tish'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setStep('otp')}
                >
                  Orqaga
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
