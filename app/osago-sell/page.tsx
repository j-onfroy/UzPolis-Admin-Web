'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, getErrorMessage } from '@/lib/api';
import { handlePhoneInput, normalizePhone, isValidPhone, handleGovNumberInput, isValidGovNumber, handlePassportSeria, handleTechSeria, handleDigits } from '@/lib/utils';
import { Car, User, FileText, CheckCircle, Clock, ShieldCheck, Wallet, TrendingUp, Plus, Trash2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Step = 'calculate' | 'owner' | 'details' | 'payment' | 'confirm';

interface AdminMe {
  id?: number;
  fullName?: string;
  passportSeries?: string;
  passportNumber?: string;
  birthdate?: string;
  pinfl?: string;
}

interface CalcResult {
  id?: string;
  amountUzs?: number;
  periodId?: number;
  limited?: boolean;
  individual?: boolean;
  ownerInn?: string;
  gosNumber?: string;
  markaName?: string;
  modelName?: string;
  vehicleColor?: string;
  issueYear?: number;
  owner?: { fullName?: string; pinfl?: string; inn?: string };
  [key: string]: unknown;
}

const RELATION_DEGREES = [
  { value: 0, label: 'Qarindosh emas' },
  { value: 1, label: 'Otasi' },
  { value: 2, label: 'Katta akasi' },
  { value: 3, label: 'Kichik akasi' },
  { value: 4, label: 'Xotini' },
  { value: 5, label: 'Onasi' },
  { value: 6, label: 'Eri' },
  { value: 7, label: "O'g'li" },
  { value: 8, label: 'Qizi' },
  { value: 9, label: 'Katta opasi' },
  { value: 10, label: 'Kichik singlisi' },
];

interface Driver {
  passSeriya: string;
  passNumber: string;
  birthDate: string;
  relative: number;
}

interface ContractResult {
  id?: string;
  amountUzs?: number;
  status?: string;
  cashbackAmount?: number;
  policyNumber?: string | number;
  policyFileUrl?: string;
  paymeUrl?: string;
  clickUrl?: string;
  [key: string]: unknown;
}

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
}

const PERIODS = [
  { id: 1, label: '12 oy' },
  { id: 2, label: '6 oy' },
];

const STEPS: { key: Step; label: string }[] = [
  { key: 'calculate', label: 'Hisoblash' },
  { key: 'owner', label: 'Egasi' },
  { key: 'details', label: 'Shartnoma' },
  { key: 'payment', label: "To'lov" },
  { key: 'confirm', label: 'Tayyor' },
];

function fmt(n?: number | null) {
  if (!n) return "0 so'm";
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_DRIVER: Driver = { passSeriya: '', passNumber: '', birthDate: '', relative: 0 };

export default function SugurtaSotishPage() {
  const [step, setStep] = useState<Step>('calculate');
  const [loading, setLoading] = useState(false);
  const [cashbackRate, setCashbackRate] = useState<number | null>(null);
  const [adminMe, setAdminMe] = useState<AdminMe | null>(null);

  // Step 1: calculate
  const [calcForm, setCalcForm] = useState({
    gosNumber: '',
    techSery: '',
    techNumber: '',
    periodId: 1,
    limited: false,
  });
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);

  // Step 2: owner passport (individual) + drivers
  const [ownerPassSeriya, setOwnerPassSeriya] = useState('');
  const [ownerPassNumber, setOwnerPassNumber] = useState('');
  const [ownerIsDriver, setOwnerIsDriver] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Step 3: contract details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState(todayStr());

  // Step 4-5: contract + payment
  const [contract, setContract] = useState<ContractResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Pending sales
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  useEffect(() => {
    api.get<number>('/cashback/my-rate')
      .then(r => setCashbackRate(typeof r.data === 'number' ? r.data : null))
      .catch(() => {});

    api.get<AdminMe>('/admins/me')
      .then(r => setAdminMe(r.data))
      .catch(() => {});

    loadPendingSales();
  }, []);

  function loadPendingSales() {
    api.get<PendingSale[]>('/osago/pending-sales')
      .then(r => setPendingSales(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }

  const isOrg = calcResult ? calcResult.individual === false : false;
  const isLimited = calcForm.limited;

  const calcAmount = calcResult?.amountUzs || 0;
  const cashbackAmount = cashbackRate != null && calcAmount > 0
    ? Math.floor(calcAmount * cashbackRate) : 0;
  const cashbackPct = cashbackRate != null ? (cashbackRate * 100).toFixed(1) + '%' : null;

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<CalcResult>('/osago/calculate', {
        gosNumber: calcForm.gosNumber.toUpperCase(),
        techSery: calcForm.techSery.toUpperCase(),
        techNumber: calcForm.techNumber,
        periodId: calcForm.periodId,
        limited: calcForm.limited,
        drivers: [],
      });
      setCalcResult(data);

      // Pre-fill owner passport for individual
      if (data.individual !== false) {
        setOwnerPassSeriya('');
        setOwnerPassNumber('');
      }

      // drivers state holds only extra drivers added by user
      setOwnerIsDriver(true);
      setDrivers([]);

      setStep('owner');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  // extra drivers: max 4 (owner auto-adds as #1 in payload, total max 5)
  function addDriver() {
    if (drivers.length >= 4) { toast.error("Maksimal 4 ta qo'shimcha haydovchi qo'shish mumkin"); return; }
    setDrivers(d => [...d, { ...EMPTY_DRIVER }]);
  }

  function removeDriver(idx: number) {
    setDrivers(d => d.filter((_, i) => i !== idx));
  }

  function updateDriver(idx: number, field: keyof Driver, value: string | number) {
    setDrivers(d => d.map((dr, i) => i === idx ? { ...dr, [field]: value } : dr));
  }

  function ownerStepValid() {
    const indivOk = !isOrg && ownerPassSeriya.length === 2 && ownerPassNumber.length === 7;
    const baseOk = isOrg || indivOk;
    if (!baseOk) return false;
    // Cheklangan (limited) uchun kamida bitta haydovchi bo'lishi shart:
    // yo egasi haydovchi, yo qo'shimcha haydovchi qo'shilgan bo'lsin.
    if (isLimited && !isOrg && !ownerIsDriver && drivers.length === 0) return false;
    return drivers.every(d => d.passSeriya.length === 2 && d.passNumber.length === 7 && !!d.birthDate);
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phoneNumber)) { toast.error("Telefon raqamini to'g'ri kiriting (+998XXXXXXXXX)"); return; }
    setLoading(true);
    try {
      const ownerPayload = isOrg
        ? { organization: { inn: calcResult?.ownerInn || calcResult?.owner?.inn || '' } }
        : { person: { passSeriya: ownerPassSeriya.toUpperCase(), passNumber: ownerPassNumber } };

      // applicant = admin (always) — send pinfl if available, otherwise birthDate
      const applicantPayload = {
        passSeriya: adminMe?.passportSeries || '',
        passNumber: adminMe?.passportNumber || '',
        ...(adminMe?.pinfl ? { pinfl: adminMe.pinfl } : {}),
        ...(adminMe?.birthdate ? { birthDate: adminMe.birthdate.split('T')[0] } : {}),
      };

      // Egasi haydovchi sifatida backend tomonidan isOwnerDriver orqali qo'shiladi.
      // Bu yerda faqat qo'shimcha haydovchilarni yuboramiz (org uchun bo'sh).
      const driversPayload: object[] = (!isOrg && isLimited)
        ? drivers.map(d => ({
            passSeriya: d.passSeriya.toUpperCase(),
            passNumber: d.passNumber,
            birthDate: d.birthDate,
            relative: d.relative ?? 0,
          }))
        : [];

      const { data } = await api.post<ContractResult>('/osago/contract', {
        calculationId: calcResult?.id,
        startDate,
        phoneNumber: normalizePhone(phoneNumber),
        gosNumber: calcResult?.gosNumber || calcForm.gosNumber,
        limited: isLimited,
        isOwnerDriver: !isOrg && isLimited ? ownerIsDriver : false,
        applicant: applicantPayload,
        owner: ownerPayload,
        drivers: driversPayload,
      });
      setContract(data);
      setStep('payment');
      toast.success('Shartnoma yaratildi!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  async function handleConfirmPayment() {
    if (!contract?.id) return;
    setConfirming(true);
    try {
      const { data } = await api.post<ContractResult>(`/osago/contracts/${contract.id}/confirm`, {});
      setContract(prev => ({ ...prev, ...data }));
      setStep('confirm');
      if (data.status === 'PAID') {
        loadPendingSales();
        toast.success("To'lov tasdiqlandi! Cashback hamyoningizga tushdi.");
      } else {
        toast.info("To'lov hali amalga oshmagan. Keyinroq qayta tekshiring.");
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setConfirming(false); }
  }

  function reset() {
    loadPendingSales();
    setStep('calculate');
    setCalcForm({ gosNumber: '', techSery: '', techNumber: '', periodId: 1, limited: false });
    setCalcResult(null);
    setOwnerPassSeriya('');
    setOwnerPassNumber('');
    setOwnerIsDriver(true);
    setDrivers([]);
    setPhoneNumber('');
    setStartDate(todayStr());
    setContract(null);
  }

  const stepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <DashboardLayout>
      <PageHeader title="Sug'urta Sotish" description="Mijozga OSAGO polisi rasmiylashtirish" />

      <div className="max-w-2xl">

        {cashbackRate != null && cashbackRate > 0 && (
          <div className="flex items-center gap-3 p-3 mb-6 rounded-xl bg-emerald-50 border border-emerald-200">
            <TrendingUp size={18} className="text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700">
              Har bir sotuvdan sizga <span className="font-bold text-emerald-800">{cashbackPct}</span> cashback hamyoningizga tushadi
            </p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i < stepIdx ? 'bg-green-100 text-green-700' :
                i === stepIdx ? 'bg-primary text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < stepIdx ? <CheckCircle size={12} /> : <span className="w-3 h-3 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>}
                <span>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-5 h-0.5 ${i < stepIdx ? 'bg-green-400' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: Calculate */}
        {step === 'calculate' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Car size={18} />Narx hisoblash</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Davlat raqami</Label>
                  <Input placeholder="01B618XC" value={calcForm.gosNumber} maxLength={8} inputMode="text"
                    onChange={e => setCalcForm(f => ({ ...f, gosNumber: handleGovNumberInput(e.target.value) }))} required />
                  {calcForm.gosNumber.length > 0 && !isValidGovNumber(calcForm.gosNumber) && (
                    <p className="text-xs text-destructive">Davlat raqami 8 ta belgidan iborat bo&apos;lishi kerak (mas: 01B618XC)</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tex pasport seriya</Label>
                    <Input placeholder="AAG" value={calcForm.techSery} maxLength={3}
                      onChange={e => setCalcForm(f => ({ ...f, techSery: handleTechSeria(e.target.value) }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tex pasport raqam</Label>
                    <Input placeholder="7029457" value={calcForm.techNumber} maxLength={7} inputMode="numeric"
                      onChange={e => setCalcForm(f => ({ ...f, techNumber: handleDigits(e.target.value, 7) }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Muddat</Label>
                  <div className="flex gap-2">
                    {PERIODS.map(p => (
                      <button key={p.id} type="button" onClick={() => setCalcForm(f => ({ ...f, periodId: p.id }))}
                        className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          calcForm.periodId === p.id ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Haydovchilar turi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button"
                      onClick={() => setCalcForm(f => ({ ...f, limited: false }))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        !calcForm.limited ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary bg-background'
                      }`}>
                      Cheklanmagan
                    </button>
                    <button type="button"
                      onClick={() => setCalcForm(f => ({ ...f, limited: true }))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        calcForm.limited ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary bg-background'
                      }`}>
                      Cheklangan
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {calcForm.limited
                      ? 'Faqat ko\'rsatilgan haydovchilar haydashi mumkin'
                      : 'Istalgan haydovchi haydashi mumkin'}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !isValidGovNumber(calcForm.gosNumber) || calcForm.techSery.length < 3 || calcForm.techNumber.length < 1}>
                  {loading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Owner info + drivers */}
        {step === 'owner' && calcResult && (
          <div className="space-y-4">
            {/* Calc result summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Sug&apos;urta miqdori</p>
                    <p className="text-3xl font-bold text-primary">{fmt(calcAmount)}</p>
                    <Badge variant="outline" className="mt-1.5">{PERIODS.find(p => p.id === calcForm.periodId)?.label}</Badge>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-mono font-semibold">{calcResult.gosNumber || calcForm.gosNumber}</p>
                    <p className="text-muted-foreground">{calcResult.markaName} {calcResult.modelName}</p>
                    {isOrg && <Badge variant="secondary" className="mt-1">Tashkilot</Badge>}
                    {isLimited && <Badge variant="secondary" className="mt-1 ml-1">Cheklangan</Badge>}
                  </div>
                </div>
                {cashbackAmount > 0 && (
                  <div className="mt-3 pt-3 border-t border-primary/10 flex items-center gap-2">
                    <Wallet size={14} className="text-emerald-600" />
                    <span className="text-sm text-emerald-700">Sizning cashbackingiz: <span className="font-bold">{fmt(cashbackAmount)}</span> ({cashbackPct})</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner passport — only for individuals */}
            {!isOrg && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><User size={16} />Avtomobil egasining ma&apos;lumotlari</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pasport seriya</Label>
                      <Input placeholder="AD" maxLength={2} value={ownerPassSeriya}
                        onChange={e => setOwnerPassSeriya(handlePassportSeria(e.target.value))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Pasport raqam</Label>
                      <Input placeholder="1234567" maxLength={7} inputMode="numeric" value={ownerPassNumber}
                        onChange={e => setOwnerPassNumber(handleDigits(e.target.value, 7))} required />
                    </div>
                  </div>
                  {calcResult?.owner?.pinfl && (
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                      PINFL: <span className="font-mono font-medium">{calcResult.owner.pinfl}</span> — tug&apos;ilgan sana avtomatik aniqlanadi
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Org info — readonly */}
            {isOrg && (
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Tashkilot</p>
                  <p className="font-medium">{calcResult.owner?.fullName || '—'}</p>
                  {calcResult.ownerInn && <p className="text-muted-foreground font-mono">INN: {calcResult.ownerInn}</p>}
                </CardContent>
              </Card>
            )}

            {/* Extra drivers — only for individual + limited */}
            {isLimited && !isOrg && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2"><User size={16} />Qo&apos;shimcha haydovchilar</span>
                    {drivers.length < 4 && (
                      <Button type="button" size="sm" variant="outline" onClick={addDriver} className="gap-1">
                        <Plus size={14} /> Qo&apos;shish
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Egasini haydovchilar ro&apos;yxatiga qo&apos;shilsinmi?</Label>
                    <Select value={ownerIsDriver ? 'yes' : 'no'} onValueChange={v => setOwnerIsDriver(v === 'yes')}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Ha</SelectItem>
                        <SelectItem value="no">Yo&apos;q</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ownerIsDriver
                        ? 'Egasi birinchi haydovchi sifatida qo’shiladi'
                        : 'Egasi haydovchilar ro’yxatiga qo’shilmaydi — kamida bitta haydovchi qo’shing'}
                    </p>
                  </div>
                  {drivers.map((driver, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{idx + (ownerIsDriver ? 2 : 1)}-haydovchi</span>
                        <button type="button" onClick={() => removeDriver(idx)}
                          className="text-destructive hover:text-destructive/70 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Seriya</Label>
                          <Input placeholder="AD" maxLength={2} value={driver.passSeriya}
                            onChange={e => updateDriver(idx, 'passSeriya', handlePassportSeria(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Raqam</Label>
                          <Input placeholder="1234567" maxLength={7} inputMode="numeric" value={driver.passNumber}
                            onChange={e => updateDriver(idx, 'passNumber', handleDigits(e.target.value, 7))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tug&apos;ilgan sana</Label>
                          <Input type="date" value={driver.birthDate}
                            onChange={e => updateDriver(idx, 'birthDate', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Qarindoshlik darajasi</Label>
                          <Select value={String(driver.relative)} onValueChange={v => updateDriver(idx, 'relative', Number(v))}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATION_DEGREES.map(r => (
                                <SelectItem key={r.value} value={String(r.value)} className="text-xs">
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('calculate')}>Orqaga</Button>
              <Button className="flex-1" disabled={!ownerStepValid()} onClick={() => setStep('details')}>
                Davom etish
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Contract details + creation */}
        {step === 'details' && (
          <div className="space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{calcResult?.markaName} {calcResult?.modelName} · {calcResult?.gosNumber || calcForm.gosNumber}</span>
                <span className="font-bold text-primary">{fmt(calcAmount)}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText size={16} />Shartnoma ma&apos;lumotlari</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleCreateContract} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Boshlanish sanasi</Label>
                    <Input type="date" value={startDate}
                      onChange={e => setStartDate(e.target.value)} min={todayStr()} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mijoz telefon raqami</Label>
                    <Input placeholder="+998901234567" value={phoneNumber} type="tel" inputMode="numeric"
                      onChange={e => setPhoneNumber(handlePhoneInput(e.target.value))}
                      maxLength={13} required />
                    {phoneNumber.length > 0 && !isValidPhone(phoneNumber) && (
                      <p className="text-xs text-destructive">Telefon raqami +998XXXXXXXXX ko&apos;rinishida bo&apos;lishi kerak</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading || !isValidPhone(phoneNumber) || !startDate}>
                    {loading ? 'Yaratilmoqda...' : 'Polis yaratish'}
                  </Button>
                </form>

                <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground"
                  onClick={() => setStep('owner')}>
                  Orqaga
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 4: Payment */}
        {step === 'payment' && contract && (
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5 text-center">
                <p className="text-xs text-muted-foreground mb-1">To&apos;lov summasi</p>
                <p className="text-4xl font-bold text-primary">{fmt(contract.amountUzs || calcAmount)}</p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">ID: {contract.id}</p>
              </CardContent>
            </Card>

            {cashbackAmount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                <Wallet size={16} className="text-emerald-600" />
                <span className="text-emerald-700">To&apos;lovdan keyin cashback: <span className="font-bold">{fmt(cashbackAmount)}</span></span>
              </div>
            )}

            <p className="text-sm text-muted-foreground font-medium">To&apos;lov tizimini tanlang:</p>

            <div className="grid grid-cols-2 gap-3">
              {contract.paymeUrl && (
                <a href={contract.paymeUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full bg-[#00A4D6] hover:bg-[#0090bc] text-white gap-2 h-12">
                    <ExternalLink size={15} />
                    Payme
                  </Button>
                </a>
              )}
              {contract.clickUrl && (
                <a href={contract.clickUrl} target="_blank" rel="noreferrer">
                  <Button className="w-full bg-[#1B2A47] hover:bg-[#152038] text-white gap-2 h-12">
                    <ExternalLink size={15} />
                    Click
                  </Button>
                </a>
              )}
            </div>

            {!contract.paymeUrl && !contract.clickUrl && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                To&apos;lov URL mavjud emas. Administratorga murojaat qiling.
              </div>
            )}

            <Button className="w-full gap-2 mt-2" onClick={handleConfirmPayment} disabled={confirming}>
              <CheckCircle size={16} />
              {confirming ? 'Tekshirilmoqda...' : "To'lovni tasdiqlash"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              To&apos;lov qilgandan so&apos;ng &quot;Tasdiqlash&quot; tugmasini bosing
            </p>
          </div>
        )}

        {/* STEP 5: Confirm / Done */}
        {step === 'confirm' && contract && (
          <div className="space-y-4">
            <Card className={`border-2 ${contract.status === 'PAID' ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
              <CardContent className="p-6 text-center">
                {contract.status === 'PAID' ? (
                  <>
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                    <p className="text-xl font-bold text-green-800 mb-1">Polis muvaffaqiyatli yaratildi!</p>
                    <p className="text-sm text-green-600">Status: <Badge className="bg-green-200 text-green-800 hover:bg-green-200">PAID</Badge></p>
                  </>
                ) : (
                  <>
                    <Clock size={48} className="text-amber-500 mx-auto mb-3" />
                    <p className="text-xl font-bold text-amber-800 mb-1">To&apos;lov kutilmoqda</p>
                    <p className="text-sm text-amber-600">Status: <Badge variant="outline">{contract.status}</Badge></p>
                  </>
                )}
              </CardContent>
            </Card>

            {cashbackAmount > 0 && contract.status === 'PAID' && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Wallet size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Cashback hamyoningizga tushdi</p>
                    <p className="text-2xl font-bold text-emerald-600">{fmt(cashbackAmount)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {contract.policyNumber && (
                <Card><CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Polis raqami</p>
                  <p className="font-bold font-mono">{contract.policyNumber}</p>
                </CardContent></Card>
              )}
              {(contract.amountUzs || calcAmount) ? (
                <Card><CardContent className="p-4">
                  <p className="text-muted-foreground text-xs">Summa</p>
                  <p className="font-bold">{fmt(contract.amountUzs || calcAmount)}</p>
                </CardContent></Card>
              ) : null}
            </div>

            {contract.policyFileUrl && (
              <a href={contract.policyFileUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <ShieldCheck size={16} />
                  Polisni yuklab olish
                </Button>
              </a>
            )}

            {contract.status !== 'PAID' && (
              <Button variant="outline" className="w-full gap-2" onClick={handleConfirmPayment} disabled={confirming}>
                <RefreshCw size={15} />
                {confirming ? 'Tekshirilmoqda...' : "To'lovni qayta tekshirish"}
              </Button>
            )}

            <Button className="w-full" onClick={reset}>
              <Clock size={16} className="mr-2" />
              Yangi polis
            </Button>
          </div>
        )}

        {/* Pending sales — summary with link to full page */}
        {step === 'calculate' && pendingSales.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 p-4 rounded-xl border border-amber-200 bg-amber-50/60">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {pendingSales.length} ta to&apos;lov kutilmoqda
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Mijozlar to&apos;lovni hali amalga oshirmagan
                </p>
              </div>
              <Link href="/pending-payments">
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 gap-1.5 flex-shrink-0">
                  <ExternalLink size={13} />
                  Ko&apos;rish
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
