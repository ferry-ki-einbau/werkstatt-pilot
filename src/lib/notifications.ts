import type { JobStatus } from '@/types';

interface NotifyPayload {
  jobId: string;
  newStatus: JobStatus;
  customerPhone: string | null;
  customerEmail: string | null;
  customerName: string;
  kennzeichen: string;
  werkstattName: string;
  tenantGoogleReviewUrl: string | null;
}

export async function notifyStatusChange(payload: NotifyPayload): Promise<void> {
  // Only notify for statuses that have customer-facing messages
  const notifiableStatuses: JobStatus[] = [
    'annahme',
    'teile_bestellt',
    'reparatur',
    'abholbereit',
    'abgeholt',
  ];

  if (!notifiableStatuses.includes(payload.newStatus)) return;

  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[notifications] Failed to send notification:', err);
  }
}
