export type Status =
  | "new"
  | "reviewing"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "rejected";

export type Priority = "low" | "medium" | "high";

export interface HistoryEntry {
  status: Status;
  at: string; // ISO
  by: string;
  note?: string;
}

export interface ActivityNote {
  id: string;
  kind: "note" | "sms";
  text: string;
  by: string;
  at: string; // ISO
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface Citizen {
  name: string;
  phone: string; // normalised latin digits, e.g. 01712345678
  email?: string;
  address: string;
}

export interface Complaint {
  id: string; // BD-2026-0117
  subject: string;
  category: string;
  department: string;
  description: string;
  priority: Priority;
  status: Status;
  citizen: Citizen;
  attachments: Attachment[];
  officerId?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  history: HistoryEntry[];
  notes: ActivityNote[];
  source: "online" | "admin";
}

export interface Officer {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  active: boolean;
}

export interface SmsTemplates {
  received: string;
  assigned: string;
  resolved: string;
}

export interface Settings {
  orgName: string;
  orgSub: string;
  slaDays: Record<Priority, number>;
  categories: string[];
  departments: string[];
  smsOnSubmit: boolean;
  smsOnStatusChange: boolean;
  smsTemplates: SmsTemplates;
}

export interface AdminProfile {
  name: string;
  role: string;
  email: string;
}

export interface DbState {
  version: number;
  complaints: Complaint[];
  officers: Officer[];
  settings: Settings;
}
