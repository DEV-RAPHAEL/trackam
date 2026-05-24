export type Role = 'owner' | 'admin' | 'user' | 'superadmin';

export type User = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: Role;
};

export type OnboardingStep = 'payment' | 'company_details' | 'team' | 'first_records' | 'done';

export type Company = {
  id: string;
  name: string;
  logo?: string;
  brand_color?: string;
  secondary_color?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'inactive' | 'active';
  onboarding_step: OnboardingStep;
  trial_ends_at?: string;
  subscription_status?: 'trialing' | 'active' | 'past_due' | 'canceled';
  subdomain?: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
};

export type ClientStatus = 'active' | 'inactive';

export type Client = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  address?: string;
  created_at: string;
};

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

export type Lead = {
  id: string;
  company_id: string;
  client_id?: string; // Optional if it's purely a lead without client profile
  name: string;
  email: string;
  phone: string;
  company: string;
  stage: LeadStage;
  last_contact_date?: string;
  next_followup_date?: string;
  notes?: string;
  created_at: string;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

export type DealStage = 'Prospect' | 'Negotiation' | 'Won' | 'Lost';

export type Deal = {
  id: string;
  company_id: string;
  client_id: string;
  title: string;
  stage: DealStage;
  value: number;
  lead_id?: string;
  created_at: string;
};

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
};

export type Task = {
  id: string;
  company_id: string;
  client_id?: string;
  assigned_to: string;        // primary assignee user id
  assignees?: string[];       // additional assignee user ids
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  due_date: string;
  progress?: number;          // 0-100
  comments?: TaskComment[];
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type InvoiceTemplate = {
  id: string;
  name: string;
  style: 'classic' | 'modern' | 'minimal' | 'luxury' | 'corporate';
  header_text?: string;
  footer_text?: string;
  accent_color?: string;
};

export type InvoiceStatus = 'unpaid' | 'paid';

export type Invoice = {
  id: string;
  company_id: string;
  client_id: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  items: InvoiceItem[];
  template_id?: string;
  notes?: string;
  is_sent: boolean;
  last_sent_at?: string;
  created_at: string;
};

export type ModuleStatus = 'locked' | 'available' | 'active';

export type SystemModule = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ModuleStatus;
  price: number;
};

export type ActivityLog = {
  id: string;
  company_id: string;
  user_id: string;
  action: string;
  description: string;
  created_at: string;
};

export type ToastType = 'info' | 'success' | 'error' | 'loading';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};
