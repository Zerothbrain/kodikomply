'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Building2, Users, Heart, Briefcase,
  Wallet, TrendingUp, ChevronRight, ChevronLeft,
  CheckCircle2, ArrowRight, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { isLoggedIn, getUser } from '../../lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Choice { value: string; label: string; desc?: string; icon?: React.ElementType; multi?: boolean }

interface Step {
  id: number;
  question: string;
  subtitle: string;
  field: string;
  multi: boolean;
  choices: Choice[];
}

// ── Wizard steps ──────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    id: 1,
    question: 'Who are you?',
    subtitle: 'This tells us which tax rules and rates apply to your situation.',
    field: 'entityType',
    multi: false,
    choices: [
      { value: 'INDIVIDUAL',      label: 'Individual',            desc: 'Personal taxes, salary, investments', icon: User },
      { value: 'SOLE_PROPRIETOR', label: 'Business Owner',        desc: 'Sole proprietor / self-employed',     icon: Briefcase },
      { value: 'COMPANY',         label: 'Company / Corporation', desc: 'Limited company, LLC, PLC',           icon: Building2 },
      { value: 'PARTNERSHIP',     label: 'Partnership',           desc: 'Two or more partners',               icon: Users },
      { value: 'NGO',             label: 'NGO / Charity',         desc: 'Non-profit, charity, trust',         icon: Heart },
      { value: 'EMPLOYER',        label: 'Employer with Staff',   desc: 'Any entity type that has employees', icon: Users },
    ],
  },
  {
    id: 2,
    question: 'What do you do?',
    subtitle: 'Select all that apply — we\'ll include every relevant module.',
    field: 'activityTypes',
    multi: true,
    choices: [
      { value: 'EMPLOYED',   label: 'I am employed',              desc: 'Someone pays my salary / PAYE',          icon: Briefcase },
      { value: 'BUSINESS',   label: 'I run a business',           desc: 'Own business income, turnover, expenses', icon: Building2 },
      { value: 'BOTH',       label: 'Employed + own business',    desc: 'Salary income AND business income',       icon: Wallet },
      { value: 'INVESTOR',   label: 'I invest',                   desc: 'Property, shares, deposits, dividends',  icon: TrendingUp },
      { value: 'FREELANCER', label: 'Freelancer / Consultant',    desc: 'Professional services, contract work',   icon: User },
      { value: 'RETIRED',    label: 'Retired',                    desc: 'Pension, retirement fund payments',      icon: User },
    ],
  },
  {
    id: 3,
    question: 'Are you a Tanzania resident?',
    subtitle: 'Residency determines which tax rates and treaty benefits apply to you.',
    field: 'residentStatus',
    multi: false,
    choices: [
      { value: 'RESIDENT',     label: 'Yes — permanent home in Tanzania', desc: 'Taxed on worldwide income at TZ rates' },
      { value: 'NON_RESIDENT', label: 'No — I live outside Tanzania',     desc: 'Taxed only on Tanzania-source income via WHT' },
      { value: 'GOVERNMENT',   label: 'Government employee',              desc: 'Tanzania government service — special rules apply' },
    ],
  },
  {
    id: 4,
    question: 'Do you have employees?',
    subtitle: 'Employers have PAYE and SDL obligations regardless of entity type.',
    field: 'hasEmployees',
    multi: false,
    choices: [
      { value: 'true',  label: 'Yes — I have staff',    desc: 'PAYE and SDL obligations apply' },
      { value: 'false', label: 'No — no employees',     desc: 'No employer PAYE obligations' },
    ],
  },
  {
    id: 5,
    question: 'What is your approximate annual income or turnover?',
    subtitle: 'This determines presumptive tax eligibility and VAT registration requirements.',
    field: 'turnoverBand',
    multi: false,
    choices: [
      { value: 'BELOW_4M',    label: 'Below TZS 4,000,000',    desc: 'Presumptive tax NIL — below threshold' },
      { value: '4M_100M',     label: 'TZS 4M – 100M',          desc: 'Presumptive tax applies · VAT not required' },
      { value: '100M_200M',   label: 'TZS 100M – 200M',        desc: 'Business income tax · Monitor VAT threshold' },
      { value: 'ABOVE_200M',  label: 'Above TZS 200M',         desc: 'VAT registration mandatory · Corporate rates' },
    ],
  },
];

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>Step {current} of {total}</span>
        <span>{Math.round((current / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {STEPS.map(s => (
          <div
            key={s.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              s.id < current ? 'bg-brand-500' : s.id === current ? 'bg-brand-600 scale-125' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const user = getUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({
    entityType: '',
    activityTypes: [],
    residentStatus: '',
    hasEmployees: '',
    turnoverBand: '',
  });

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    // If already has profile → go to dashboard
    api.get('/profile').then(r => {
      if (r.data) router.push('/dashboard');
    }).catch(() => {});
  }, [router]);

  const currentStep = STEPS[step - 1];

  function toggleChoice(value: string) {
    const field = currentStep.field;
    if (currentStep.multi) {
      const current = (answers[field] as string[]) ?? [];
      // Mutually exclusive: BOTH replaces EMPLOYED+BUSINESS
      if (value === 'BOTH') {
        setAnswers(a => ({ ...a, [field]: ['BOTH'] }));
        return;
      }
      const filtered = current.filter(v => v !== 'BOTH');
      setAnswers(a => ({
        ...a,
        [field]: filtered.includes(value) ? filtered.filter(v => v !== value) : [...filtered, value],
      }));
    } else {
      setAnswers(a => ({ ...a, [field]: value }));
    }
  }

  function isSelected(value: string): boolean {
    const field = currentStep.field;
    const val = answers[field];
    if (Array.isArray(val)) return val.includes(value);
    return val === value;
  }

  function canProceed(): boolean {
    const val = answers[currentStep.field];
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  }

  function next() {
    if (step < STEPS.length) setStep(s => s + 1);
    else submit();
  }

  function back() {
    if (step > 1) setStep(s => s - 1);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const activityRaw = answers.activityTypes as string[];
      // Normalise: BOTH → EMPLOYED + BUSINESS
      const activityTypes = activityRaw.includes('BOTH')
        ? ['EMPLOYED', 'BUSINESS']
        : activityRaw;

      await api.post('/profile', {
        entityType: answers.entityType,
        activityTypes,
        residentStatus: answers.residentStatus,
        hasEmployees: answers.hasEmployees === 'true',
        turnoverBand: answers.turnoverBand,
      });
      toast.success('Your tax profile is ready!');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save profile — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white font-black text-sm num">KC</span>
          </div>
          <span className="font-bold text-gray-900">KodiComply</span>
        </Link>
        <span className="text-xs text-gray-400">Setting up your tax profile</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* Welcome header — only on step 1 */}
          {step === 1 && (
            <div className="text-center mb-10 animate-fade-up">
              <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                <CheckCircle2 size={28} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-gray-500">
                Answer 5 quick questions and we&apos;ll build your complete tax profile — showing exactly which taxes apply to you and how to stay compliant.
              </p>
            </div>
          )}

          {/* Card */}
          <div className="card shadow-card-hover animate-fade-up">
            <ProgressBar current={step} total={STEPS.length} />

            {/* Question */}
            <div className="mb-8">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
                Question {step}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.question}</h2>
              <p className="text-gray-500 text-sm">{currentStep.subtitle}</p>
              {currentStep.multi && (
                <p className="text-xs text-brand-600 font-medium mt-2">Select all that apply</p>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {currentStep.choices.map(choice => {
                const Icon = choice.icon;
                const selected = isSelected(choice.value);
                return (
                  <button
                    key={choice.value}
                    onClick={() => toggleChoice(choice.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 group ${
                      selected
                        ? 'border-brand-500 bg-brand-50 shadow-glow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {Icon && (
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'bg-brand-600' : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <Icon size={17} className={selected ? 'text-white' : 'text-gray-500'} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-sm ${selected ? 'text-brand-700' : 'text-gray-800'}`}>
                            {choice.label}
                          </p>
                          {selected && (
                            <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0" />
                          )}
                        </div>
                        {choice.desc && (
                          <p className={`text-xs mt-0.5 ${selected ? 'text-brand-600' : 'text-gray-400'}`}>
                            {choice.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={back}
                disabled={step === 1}
                className="btn-ghost disabled:opacity-0 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <button
                onClick={next}
                disabled={!canProceed() || submitting}
                className="btn-primary px-8 disabled:opacity-40 flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Building profile...</>
                ) : step === STEPS.length ? (
                  <>Build My Tax Profile <ArrowRight size={15} /></>
                ) : (
                  <>Continue <ChevronRight size={15} /></>
                )}
              </button>
            </div>
          </div>

          {/* Skip */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Already know what you need?{' '}
            <Link href="/dashboard" className="text-brand-600 hover:underline">
              Go to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
