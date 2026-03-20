import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO, differenceInWeeks } from 'date-fns';
import { de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  const parsed = parseISO(date);
  if (!isValid(parsed)) return '—';
  return format(parsed, 'dd.MM.yyyy', { locale: de });
}

export function formatDatetime(date: string | null | undefined): string {
  if (!date) return '—';
  const parsed = parseISO(date);
  if (!isValid(parsed)) return '—';
  return format(parsed, 'dd.MM.yyyy HH:mm', { locale: de });
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—';
  const parsed = parseISO(date);
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: de });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function getTuevStatus(tuevDatum: string | null | undefined): {
  status: 'ok' | 'warning' | 'expired' | 'unknown';
  label: string;
  color: string;
} {
  if (!tuevDatum) return { status: 'unknown', label: 'Unbekannt', color: '#6b7280' };
  const parsed = parseISO(tuevDatum);
  if (!isValid(parsed)) return { status: 'unknown', label: 'Unbekannt', color: '#6b7280' };

  const now = new Date();
  const weeksUntil = differenceInWeeks(parsed, now);

  if (weeksUntil < 0) {
    return { status: 'expired', label: `Abgelaufen (${formatDate(tuevDatum)})`, color: '#ef4444' };
  }
  if (weeksUntil <= 6) {
    return { status: 'warning', label: `Fällig ${formatDate(tuevDatum)}`, color: '#f97316' };
  }
  return { status: 'ok', label: `Gültig bis ${formatDate(tuevDatum)}`, color: '#22c55e' };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
