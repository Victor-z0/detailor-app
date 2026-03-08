"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Settings = {
  theme_color:      string;
  currency_symbol:  string;
  language:         string;
  business_name:    string;
  slug:             string;
  avatar_url:       string;
  cover_url:        string;
  plan:             string;
};

const DEFAULTS: Settings = {
  theme_color:     '#2563eb',
  currency_symbol: '$',
  language:        'en',
  business_name:   '',
  slug:            '',
  avatar_url:      '',
  cover_url:       '',
  plan:            'essential',
};

const SettingsContext = createContext<{
  settings: Settings;
  reload: () => void;
}>({ settings: DEFAULTS, reload: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('theme_color, currency_symbol, language, business_name, slug, avatar_url, cover_url, plan')
      .eq('id', user.id)
      .single();
    if (data) {
      setSettings({
        theme_color:     data.theme_color     || DEFAULTS.theme_color,
        currency_symbol: data.currency_symbol || DEFAULTS.currency_symbol,
        language:        data.language        || DEFAULTS.language,
        business_name:   data.business_name   || '',
        slug:            data.slug            || '',
        avatar_url:      data.avatar_url      || '',
        cover_url:       data.cover_url       || '',
        plan:            data.plan            || 'essential',
      });
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, reload: load }}>
      <style>{`:root { --brand: ${settings.theme_color}; }`}</style>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useCurrency() {
  const { settings } = useSettings();
  return (amount: number) =>
    `${settings.currency_symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}