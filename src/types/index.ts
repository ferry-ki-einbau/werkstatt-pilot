export type JobStatus =
  | 'annahme'
  | 'diagnose'
  | 'teile_bestellt'
  | 'teile_da'
  | 'reparatur'
  | 'abholbereit'
  | 'abgeholt';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type UserRole = 'owner' | 'admin' | 'technician';
export type NotificationType = 'sms' | 'email' | 'whatsapp';
export type NotificationStatus = 'sent' | 'failed' | 'pending';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  google_review_url: string | null;
  logo_url: string | null;
  sms_enabled: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  customer_id: string;
  kennzeichen: string;
  marke: string | null;
  modell: string | null;
  baujahr: number | null;
  vin: string | null;
  tuev_datum: string | null;
  letzte_inspektion: string | null;
  letzter_km_stand: number | null;
  created_at: string;
}

export interface Job {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  customer_id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  estimated_cost: number | null;
  actual_cost: number | null;
  estimated_ready: string | null;
  technician_id: string | null;
  internal_notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: Customer;
  vehicle?: Vehicle;
  technician?: Profile;
}

export interface NotificationLog {
  id: string;
  tenant_id: string;
  job_id: string | null;
  customer_id: string | null;
  type: NotificationType;
  status: NotificationStatus;
  message: string | null;
  recipient: string | null;
  created_at: string;
}

export interface JobStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const JOB_STATUS_CONFIG: Record<JobStatus, JobStatusConfig> = {
  annahme: {
    label: 'Annahme',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.4)',
  },
  diagnose: {
    label: 'Diagnose',
    color: '#eab308',
    bgColor: 'rgba(234,179,8,0.15)',
    borderColor: 'rgba(234,179,8,0.4)',
  },
  teile_bestellt: {
    label: 'Teile bestellt',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.4)',
  },
  teile_da: {
    label: 'Teile da',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.15)',
    borderColor: 'rgba(168,85,247,0.4)',
  },
  reparatur: {
    label: 'In Reparatur',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  abholbereit: {
    label: 'Abholbereit',
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  abgeholt: {
    label: 'Abgeholt',
    color: '#6b7280',
    bgColor: 'rgba(107,114,128,0.15)',
    borderColor: 'rgba(107,114,128,0.4)',
  },
};

export const JOB_STATUS_ORDER: JobStatus[] = [
  'annahme',
  'diagnose',
  'teile_bestellt',
  'teile_da',
  'reparatur',
  'abholbereit',
  'abgeholt',
];

export const PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string }> = {
  low: { label: 'Niedrig', color: '#6b7280' },
  normal: { label: 'Normal', color: '#3b82f6' },
  high: { label: 'Hoch', color: '#f97316' },
  urgent: { label: 'Dringend', color: '#ef4444' },
};
