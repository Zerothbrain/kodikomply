'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Lang = 'EN' | 'SW';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'EN',
  setLang: () => {},
  t: (key, fallback) => fallback ?? key,
});

// Bundled translations as fallback (avoids 404 on first load)
const BUNDLED: Record<Lang, Record<string, string>> = {
  EN: {
    'nav.home': 'Home', 'nav.dashboard': 'Dashboard', 'nav.calculators': 'Calculators',
    'nav.tools': 'Tools', 'nav.reports': 'Reports', 'nav.admin': 'Admin',
    'nav.login': 'Login', 'nav.register': 'Register', 'nav.logout': 'Logout',
    'tax.employment_income': 'Employment Income', 'tax.business_income': 'Business Income',
    'tax.investment_income': 'Investment Income', 'tax.tax_payable': 'Tax Payable',
    'tax.taxable_income': 'Taxable Income', 'tax.deductions': 'Deductions',
    'tax.exemptions': 'Exemptions', 'tax.withholding_tax': 'Withholding Tax',
    'tax.vat': 'Value Added Tax (VAT)', 'tax.filing_deadline': 'Filing Deadline',
    'tax.penalty': 'Penalty', 'tax.registration': 'Tax Registration',
    'tax.paye': 'PAYE', 'tax.sdl': 'Skills Development Levy',
    'tax.nssf': 'NSSF Contribution', 'tax.gross_income': 'Gross Income',
    'tax.net_income': 'Net Income', 'tax.effective_rate': 'Effective Tax Rate',
  },
  SW: {
    'nav.home': 'Nyumbani', 'nav.dashboard': 'Dashibodi', 'nav.calculators': 'Mahesabu',
    'nav.tools': 'Zana', 'nav.reports': 'Ripoti', 'nav.admin': 'Msimamizi',
    'nav.login': 'Ingia', 'nav.register': 'Jiandikishe', 'nav.logout': 'Toka',
    'tax.employment_income': 'Mapato ya ajira', 'tax.business_income': 'Mapato ya biashara',
    'tax.investment_income': 'Mapato ya uwekezaji', 'tax.tax_payable': 'Kodi inayolipwa',
    'tax.taxable_income': 'Mapato yanayotozwa kodi', 'tax.deductions': 'Makato',
    'tax.exemptions': 'Msamaha wa kodi', 'tax.withholding_tax': 'Kodi inayokatwa chanzo',
    'tax.vat': 'Kodi ya Ongezeko la Thamani (VAT)', 'tax.filing_deadline': 'Tarehe ya mwisho ya kuwasilisha',
    'tax.penalty': 'Faini', 'tax.registration': 'Usajili wa kodi',
    'tax.paye': 'Kodi ya Mishahara (PAYE)', 'tax.sdl': 'Ushuru wa Ujuzi (SDL)',
    'tax.nssf': 'Mchango wa NSSF', 'tax.gross_income': 'Mapato ghafi',
    'tax.net_income': 'Mapato halisi', 'tax.effective_rate': 'Kiwango halisi cha kodi',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('EN');
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('kodicomply_lang') as Lang | null;
    if (stored === 'EN' || stored === 'SW') setLangState(stored);
  }, []);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    fetch(`${API}/api/calculator/translations/${lang}`)
      .then(r => r.json())
      .then((data: Record<string, string>) => setOverrides(data))
      .catch(() => setOverrides({}));
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('kodicomply_lang', l);
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return overrides[key] ?? BUNDLED[lang][key] ?? fallback ?? key;
  }, [lang, overrides]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
