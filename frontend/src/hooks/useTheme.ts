import { useEffect, useState } from 'react';

export interface ThemeColors {
  dark: boolean;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  bgPage: string;
  bgCard: string;
  bgInput: string;
  borderCard: string;
  borderInput: string;
  borderSubtle: string;
  shadowCard: string;
  hoverBg: string;
  subtleBg: string;
  subtleBorder: string;
  surfaceDim: string;
  surfaceCard: string;
  greenBg: string;
  greenText: string;
  amberBg: string;
  amberText: string;
  redBg: string;
  redText: string;
  blueBg: string;
  blueText: string;
  grayBg: string;
  grayText: string;
  tooltipBg: string;
  tooltipBorder: string;
  badgeSuperadmin: { bg: string; text: string };
  badgeAgente: { bg: string; text: string };
  loaderBg: string;
}

const DARK: ThemeColors = {
  dark: true,
  textPrimary: '#eaf1ff',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  bgPage: 'var(--surface)',
  bgCard: 'rgba(26, 54, 93, 0.45)',
  bgInput: 'rgba(13, 26, 46, 0.6)',
  borderCard: 'rgba(59, 130, 246, 0.12)',
  borderInput: 'rgba(59, 130, 246, 0.2)',
  borderSubtle: 'rgba(59, 130, 246, 0.08)',
  shadowCard: '0 4px 24px rgba(13, 26, 46, 0.6)',
  hoverBg: 'rgba(59,130,246,0.08)',
  subtleBg: 'rgba(59,130,246,0.05)',
  subtleBorder: 'rgba(59,130,246,0.08)',
  surfaceDim: 'rgba(13, 26, 46, 0.4)',
  surfaceCard: 'rgba(20, 36, 64, 0.7)',
  greenBg: 'rgba(16,185,129,0.15)',
  greenText: '#34d399',
  amberBg: 'rgba(245,158,11,0.15)',
  amberText: '#fbbf24',
  redBg: 'rgba(239,68,68,0.15)',
  redText: '#f87171',
  blueBg: 'rgba(59,130,246,0.15)',
  blueText: '#60a5fa',
  grayBg: 'rgba(148,163,184,0.1)',
  grayText: '#94a3b8',
  tooltipBg: '#142440',
  tooltipBorder: 'rgba(59,130,246,0.2)',
  badgeSuperadmin: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  badgeAgente: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc' },
  loaderBg: 'rgba(26, 54, 93, 0.35)',
};

const LIGHT: ThemeColors = {
  dark: false,
  textPrimary: '#0d1c2e',
  textSecondary: '#43474e',
  textMuted: '#74777f',
  bgPage: '#f5f7fa',
  bgCard: '#ffffff',
  bgInput: '#ffffff',
  borderCard: 'rgba(26, 54, 93, 0.08)',
  borderInput: '#c4c6cf',
  borderSubtle: 'rgba(26, 54, 93, 0.06)',
  shadowCard: '0 4px 24px rgba(0, 0, 0, 0.06)',
  hoverBg: 'rgba(26,54,93,0.04)',
  subtleBg: 'rgba(26,54,93,0.03)',
  subtleBorder: 'rgba(26,54,93,0.06)',
  surfaceDim: '#ece0e0',
  surfaceCard: '#ffffff',
  greenBg: '#ECFDF5',
  greenText: '#059669',
  amberBg: '#FFFBEB',
  amberText: '#D97706',
  redBg: '#FEF2F2',
  redText: '#DC2626',
  blueBg: '#E0E7FF',
  blueText: '#3730A3',
  grayBg: '#F3F4F6',
  grayText: '#6B7280',
  tooltipBg: '#ffffff',
  tooltipBorder: 'rgba(26,54,93,0.15)',
  badgeSuperadmin: { bg: '#FEF3C7', text: '#92400E' },
  badgeAgente: { bg: '#E0E7FF', text: '#3730A3' },
  loaderBg: 'rgba(26, 54, 93, 0.06)',
};

export function useTheme(): ThemeColors {
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return dark ? DARK : LIGHT;
}
