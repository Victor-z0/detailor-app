"use client";
import { SettingsProvider } from '@/context/settingsContext';
import DashboardShell from '@/components/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DashboardShell>{children}</DashboardShell>
    </SettingsProvider>
  );
}