"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Settings = {
  business_name: string;
  brand_color: string;
  currency_symbol: string;
  language: string; // 🌐 Added Language
};

const SettingsContext = createContext<Settings | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    business_name: 'Studio',
    brand_color: '#000000',
    currency_symbol: '$',
    language: 'en', // Default to English
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, brand_color, currency_symbol, language')
        .eq('id', user.id)
        .single();

      if (profile) {
        setSettings({
          business_name: profile.business_name || 'Studio',
          brand_color: profile.brand_color || '#000000',
          currency_symbol: profile.currency_symbol || '$',
          language: profile.language || 'en',
        });
      }
    }
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};