import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Company, User, Client, Lead, LeadActivity, Deal, Task, TaskComment,
  Invoice, SystemModule, ActivityLog, InvoiceTemplate,
  Toast, ToastType, ClientStatus, DealStage, LeadStage,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AppState {
  isAuthenticated: boolean;
  currentCompany: Company | null;
  currentUser: User | null;
  clients: Client[];
  leads: Lead[];
  leadActivities: Record<string, LeadActivity[]>;
  deals: Deal[];
  tasks: Task[];
  invoices: Invoice[];
  invoiceTemplates: InvoiceTemplate[];
  modules: SystemModule[];
  activityLogs: ActivityLog[];
  notifications: Toast[];
  token: string | null;
  analytics: any | null;
  team: User[];
  invoiceDraft: any | null;
  theme: 'light' | 'dark';
  pendingOtpEmail: string | null;


  setTheme: (theme: 'light' | 'dark') => void;
  setInvoiceDraft: (draft: any | null) => void;
  addToast: (message: string, type?: ToastType) => string;
  removeToast: (id: string) => void;

  addClient: (client: Omit<Client, 'id' | 'created_at'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  fetchLeadActivities: (leadId: string) => Promise<void>;
  addLeadActivity: (leadId: string, content: string) => Promise<void>;
  convertLeadToClient: (leadId: string) => void;

  addDeal: (deal: Omit<Deal, 'id' | 'created_at'>) => void;
  updateDeal: (id: string, data: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'created_at'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addTaskComment: (taskId: string, body: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'created_at'>) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<boolean>;
  deleteInvoice: (id: string) => Promise<boolean>;

  addInvoiceTemplate: (template: Omit<InvoiceTemplate, 'id'>) => void;
  updateInvoiceTemplate: (id: string, data: Partial<InvoiceTemplate>) => void;

  updateCompanyBranding: (data: Partial<Company>) => void;

  sendInvoice: (id: string) => Promise<boolean>;
  sendFollowUp: (id: string) => Promise<boolean>;

  logActivity: (action: string, description: string) => void;
  unlockModule: (moduleId: string) => void;

  login: (email?: string, password?: string, subdomain?: string | null) => Promise<{ requiresOtp?: boolean; email?: string } | void>;
  verifyLoginOtp: (email: string, code: string) => Promise<void>;
  logout: () => void;

  registerCompany: (companyName: string, userName: string, email: string, password?: string) => Promise<{ success: boolean; subdomain?: string }>;
  loginWithToken: (token: string) => Promise<boolean>;
  updateCompanyOnboarding: (updates: Partial<Company>) => void;
  addUser: (user: Omit<User, 'id' | 'company_id'>) => void;
  deleteUser: (id: string) => void;
  resendInvite: (id: string) => Promise<void>;
  seedSampleData: () => Promise<void>;
  fetchInitialData: (companyId: string) => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  verifyInvite: (token: string) => Promise<boolean>;
  acceptInvite: (token: string, password: string) => Promise<boolean>;
  pollActivityLogs: () => Promise<void>;
}

const initialTemplates: InvoiceTemplate[] = [
  { id: 'tpl-classic', name: 'Classic Professional', style: 'classic', header_text: 'INVOICE', footer_text: 'Thank you for your business!', accent_color: '#4f46e5' },
  { id: 'tpl-modern', name: 'Modern Gradient', style: 'modern', header_text: 'BILLING', accent_color: '#0ea5e9' },
  { id: 'tpl-minimal', name: 'Minimalist', style: 'minimal', accent_color: '#1e293b' },
  { id: 'tpl-luxury', name: 'Midnight Luxury', style: 'luxury', header_text: 'PREMIUM INVOICE', accent_color: '#fbbf24', footer_text: 'Excellence in every detail.' },
  { id: 'tpl-corporate', name: 'Business Corporate', style: 'corporate', header_text: 'TAX INVOICE', accent_color: '#2563eb' },
];

const initialModules: SystemModule[] = [
  { id: 'mod-1', name: 'POS System', slug: 'pos', description: 'Manage in-store sales and inventory seamlessly.', status: 'available', price: 49 },
  { id: 'mod-2', name: 'HR Management', slug: 'hr', description: 'Employee records, attendance, and payroll.', status: 'locked', price: 99 },
  { id: 'mod-3', name: 'Accounting', slug: 'accounting', description: 'Full double-entry accounting ledger.', status: 'locked', price: 79 },
  { id: 'mod-4', name: 'Projects', slug: 'projects', description: 'Advanced project tracking and time logging.', status: 'available', price: 39 },
  { id: 'mod-5', name: 'Support Tickets', slug: 'support', description: 'Helpdesk for your customers.', status: 'locked', price: 29 },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentCompany: null,
      currentUser: null,
      clients: [],
      leads: [],
      leadActivities: {},
      deals: [],
      tasks: [],
      invoices: [],
      invoiceTemplates: initialTemplates,
      modules: initialModules,
      activityLogs: [],
      notifications: [],
      token: null,
      analytics: null,
      team: [],
      invoiceDraft: null,
      theme: 'dark',
      pendingOtpEmail: null,

      setTheme: (theme) => set({ theme }),
      setInvoiceDraft: (draft) => set({ invoiceDraft: draft }),

      addToast: (message, type = 'info') => {
        const id = uuidv4();
        set((state) => ({ notifications: [...state.notifications, { id, message, type }] }));
        if (type !== 'loading') {
          setTimeout(() => get().removeToast(id), 3000);
        }
        return id;
      },

      removeToast: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

      authFetch: async (url: string, options: RequestInit = {}) => {
        const token = get().token;
        if (!token) {
          return new Response(JSON.stringify({ error: 'Not authenticated' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const headers = {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) get().logout();
        return res;
      },

      addClient: (data) => set((state) => {
        const newClient = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
        get().authFetch(API_URL + '/api/clients', { method: 'POST', body: JSON.stringify(newClient) }).catch(console.error);
        get().addToast(`Client ${newClient.name} added`, 'success');
        get().logActivity('Client Added', `Added new client: ${newClient.name}`);
        return { clients: [...state.clients, newClient] };
      }),

      updateClient: (id, data) => set((state) => {
        get().authFetch(`${API_URL}/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch(console.error);
        get().addToast('Client updated', 'success');
        const client = state.clients.find(c => c.id === id);
        if (client) get().logActivity('Client Updated', `Updated client profile: ${client.name}`);
        return { clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c) };
      }),

      deleteClient: (id) => set((state) => {
        get().authFetch(`${API_URL}/api/clients/${id}`, { method: 'DELETE' }).catch(console.error);
        get().addToast('Client removed', 'info');
        return { clients: state.clients.filter(c => c.id !== id) };
      }),

      addLead: (data) => set((state) => {
        const newLead = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
        get().authFetch(API_URL + '/api/leads', { method: 'POST', body: JSON.stringify(newLead) }).catch(console.error);
        get().addToast(`Lead ${newLead.name} captured`, 'success');
        return { leads: [...state.leads, newLead] };
      }),

      updateLead: (id, updates) => set((state) => {
        get().authFetch(`${API_URL}/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(updates) }).catch(console.error);
        return { leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l) };
      }),

      deleteLead: (id) => set((state) => {
        get().authFetch(`${API_URL}/api/leads/${id}`, { method: 'DELETE' }).catch(console.error);
        get().addToast('Lead deleted', 'info');
        return { leads: state.leads.filter(l => l.id !== id) };
      }),

      fetchLeadActivities: async (leadId) => {
        try {
          const res = await get().authFetch(`${API_URL}/api/leads/${leadId}/activities`);
          const activities = await res.json();
          if (Array.isArray(activities)) {
            set((state) => ({
              leadActivities: { ...state.leadActivities, [leadId]: activities }
            }));
          }
        } catch (error) {
          console.error('Failed to fetch lead activities:', error);
        }
      },

      addLeadActivity: async (leadId, content) => {
        try {
          const res = await get().authFetch(`${API_URL}/api/leads/${leadId}/activities`, {
            method: 'POST',
            body: JSON.stringify({ content })
          });
          const activity = await res.json();
          if (activity.id) {
            set((state) => {
              const currentActivities = state.leadActivities[leadId] || [];
              return {
                leadActivities: {
                  ...state.leadActivities,
                  [leadId]: [activity, ...currentActivities]
                }
              };
            });
            get().addToast('Activity logged', 'success');
          } else {
            console.error('API Error adding lead activity:', activity);
            get().addToast(`Failed: ${activity.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          console.error('Failed to add lead activity:', error);
          get().addToast('Failed to log activity', 'error');
        }
      },

      convertLeadToClient: (leadId) => set((state) => {
        const lead = state.leads.find(l => l.id === leadId);
        if (!lead || !state.currentCompany) return state;

        const newClientId = uuidv4();
        const newClient = {
          id: newClientId,
          company_id: state.currentCompany.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: 'inactive' as ClientStatus,
          created_at: new Date().toISOString(),
        };
        const newDeal = {
          id: uuidv4(),
          company_id: state.currentCompany.id,
          client_id: newClientId,
          title: `Deal with ${lead.name}`,
          value: 0,
          stage: 'Prospect' as DealStage,
          created_at: new Date().toISOString(),
        };
        const updatedLead = { ...lead, stage: 'Converted' as LeadStage, client_id: newClientId };

        get().authFetch(API_URL + '/api/clients', { method: 'POST', body: JSON.stringify(newClient) })
          .then(() => get().authFetch(API_URL + '/api/deals', { method: 'POST', body: JSON.stringify(newDeal) }))
          .then(() => get().authFetch(`${API_URL}/api/leads/${leadId}`, { method: 'PUT', body: JSON.stringify({ stage: 'Converted', client_id: newClientId }) }))
          .catch(console.error);

        get().addToast(`Lead converted — Client & Deal created`, 'success');
        return {
          clients: [...state.clients, newClient],
          deals: [...state.deals, newDeal],
          leads: state.leads.map(l => l.id === leadId ? updatedLead : l),
        };
      }),

      addDeal: (data) => set((state) => {
        const newDeal = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
        get().authFetch(API_URL + '/api/deals', { method: 'POST', body: JSON.stringify(newDeal) }).catch(console.error);
        get().addToast(`Deal "${newDeal.title}" created`, 'success');
        get().logActivity('Deal Created', `Created deal: ${newDeal.title}`);
        return { deals: [...state.deals, newDeal] };
      }),

      updateDeal: (id, updates) => set((state) => {
        get().authFetch(`${API_URL}/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(updates) }).catch(console.error);
        const deal = state.deals.find(d => d.id === id);
        if (deal && updates.stage && updates.stage !== deal.stage) {
          get().logActivity('Deal Stage Updated', `Moved deal "${deal.title}" to ${updates.stage}`);
        } else if (deal) {
          get().logActivity('Deal Updated', `Updated deal: ${deal.title}`);
        }
        return { deals: state.deals.map(d => d.id === id ? { ...d, ...updates } : d) };
      }),

      deleteDeal: (id) => set((state) => {
        get().authFetch(`${API_URL}/api/deals/${id}`, { method: 'DELETE' }).catch(console.error);
        get().addToast('Deal removed', 'info');
        return { deals: state.deals.filter(d => d.id !== id) };
      }),

      addTask: (data) => set((state) => {
        const newTask = { ...data, id: uuidv4(), created_at: new Date().toISOString(), comments: [] };
        get().authFetch(API_URL + '/api/tasks', { method: 'POST', body: JSON.stringify(newTask) }).catch(console.error);
        get().addToast(`Task "${newTask.title}" assigned`, 'success');
        return { tasks: [...state.tasks, newTask] };
      }),

      updateTask: (id, data) => set((state) => {
        get().authFetch(`${API_URL}/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }).catch(console.error);
        if (data.status === 'done') get().addToast('Task completed! 🎉', 'success');
        else get().addToast('Task updated', 'info');
        return { tasks: state.tasks.map(t => t.id === id ? { ...t, ...data } : t) };
      }),

      deleteTask: (id) => set((state) => {
        get().authFetch(`${API_URL}/api/tasks/${id}`, { method: 'DELETE' }).catch(console.error);
        get().addToast('Task deleted', 'info');
        return { tasks: state.tasks.filter(t => t.id !== id) };
      }),

      addTaskComment: (taskId, body) => set((state) => {
        const user = state.currentUser;
        if (!user) return state;
        const comment: TaskComment = {
          id: uuidv4(), task_id: taskId, user_id: user.id,
          user_name: user.name, body, created_at: new Date().toISOString(),
        };
        const updatedTasks = state.tasks.map(t =>
          t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t
        );
        const task = updatedTasks.find(t => t.id === taskId);
        if (task) {
          get().authFetch(`${API_URL}/api/tasks/${taskId}`, {
            method: 'PUT', body: JSON.stringify({ comments: task.comments }),
          }).catch(console.error);
        }
        return { tasks: updatedTasks };
      }),

      addInvoice: (data) => set((state) => {
        const newInvoice = { ...data, id: uuidv4(), created_at: new Date().toISOString() };
        get().authFetch(API_URL + '/api/invoices', { method: 'POST', body: JSON.stringify(newInvoice) }).catch(console.error);
        get().addToast('Invoice generated', 'success');
        return { invoices: [...state.invoices, newInvoice] };
      }),

      updateInvoice: async (id, data) => {
        try {
          const res = await get().authFetch(`${API_URL}/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
          if (res.ok) {
            get().addToast('Invoice updated ✓', 'info');
            set((state) => {
              if (data.status === 'paid') {
                const inv = state.invoices.find(i => i.id === id);
                if (inv?.client_id) {
                  get().updateClient(inv.client_id, { status: 'active' });
                  setTimeout(() => get().addToast('Client automatically set to Active!', 'success'), 800);
                }
              }
              return { invoices: state.invoices.map(i => i.id === id ? { ...i, ...data } : i) };
            });
            return true;
          } else {
            get().addToast('Failed to update invoice', 'error');
            return false;
          }
        } catch (err) {
          console.error(err);
          get().addToast('Error updating invoice', 'error');
          return false;
        }
      },

      deleteInvoice: async (id) => {
        try {
          const res = await get().authFetch(`${API_URL}/api/invoices/${id}`, { method: 'DELETE' });
          if (res.ok) {
            get().addToast('Invoice deleted ✓', 'info');
            set((state) => ({ invoices: state.invoices.filter(i => i.id !== id) }));
            return true;
          } else {
            get().addToast('Failed to delete invoice', 'error');
            return false;
          }
        } catch (err) {
          console.error(err);
          get().addToast('Error deleting invoice', 'error');
          return false;
        }
      },

      addInvoiceTemplate: (data) => set((state) => {
        const newTemplate = { ...data, id: uuidv4() };
        return { invoiceTemplates: [...state.invoiceTemplates, newTemplate] };
      }),

      updateInvoiceTemplate: (id, data) => set((state) => ({
        invoiceTemplates: state.invoiceTemplates.map(t => t.id === id ? { ...t, ...data } : t),
      })),

      updateCompanyBranding: (data) => set((state) => {
        if (!state.currentCompany) return state;
        get().authFetch(`${API_URL}/api/companies/${state.currentCompany.id}`, {
          method: 'PUT', body: JSON.stringify(data),
        }).catch(console.error);
        return { currentCompany: { ...state.currentCompany, ...data } };
      }),

      sendInvoice: async (id) => {
        const toastId = get().addToast('Sending invoice email...', 'loading');
        try {
          const res = await get().authFetch(`${API_URL}/api/invoices/${id}/send`, { method: 'POST' });
          get().removeToast(toastId);
          if (res.ok) {
            get().addToast('Invoice emailed successfully ✓', 'success');
            set(state => ({
              invoices: state.invoices.map(i =>
                i.id === id ? { ...i, is_sent: true, last_sent_at: new Date().toISOString() } : i
              ),
            }));
            return true;
          } else {
            const err = await res.json().catch(() => ({}));
            const errMsg = err.details?.message || err.error || 'Failed to send invoice email';
            get().addToast(errMsg, 'error');
            return false;
          }
        } catch {
          get().removeToast(toastId);
          get().addToast('Error sending email', 'error');
          return false;
        }
      },

      sendFollowUp: async (id) => {
        const toastId = get().addToast('Sending follow-up reminder...', 'loading');
        try {
          const res = await get().authFetch(`${API_URL}/api/invoices/${id}/follow-up`, { method: 'POST' });
          get().removeToast(toastId);
          if (res.ok) {
            get().addToast('Follow-up reminder sent ✓', 'success');
            return true;
          } else {
            const err = await res.json().catch(() => ({}));
            const errMsg = err.details?.message || err.error || 'Failed to send reminder';
            get().addToast(errMsg, 'error');
            return false;
          }
        } catch {
          get().removeToast(toastId);
          get().addToast('Error sending reminder', 'error');
          return false;
        }
      },

      logActivity: (action, description) => set((state) => {
        const user = state.currentUser;
        if (!user) return state;
        const newLog: ActivityLog = {
          id: uuidv4(), company_id: user.company_id, user_id: user.id,
          action, description, created_at: new Date().toISOString(),
        };
        get().authFetch(API_URL + '/api/activity-logs', { method: 'POST', body: JSON.stringify(newLog) }).catch(console.error);
        return { activityLogs: [newLog, ...state.activityLogs].slice(0, 50) };
      }),

      unlockModule: (moduleId) => set((state) => {
        get().authFetch(`${API_URL}/api/modules/${moduleId}`, {
          method: 'PUT', body: JSON.stringify({ status: 'active' }),
        }).catch(console.error);
        return { modules: state.modules.map(m => m.id === moduleId ? { ...m, status: 'active' } : m) };
      }),

      login: async (email, password, subdomain) => {
        try {
          const res = await fetch(API_URL + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, subdomain }),
          });
          const data = await res.json();
          if (!res.ok) {
            const msg = res.status === 429 ? data.error : (data.error || 'Invalid credentials');
            get().addToast(msg, 'error');
            return;
          }
          if (data.requiresOtp) {
            // Password valid — OTP sent, redirect to verify-otp page
            // Clear any stale authenticated session first to prevent premature redirects
            set({
              pendingOtpEmail: data.email,
              isAuthenticated: false,
              currentUser: null,
              currentCompany: null,
              token: null,
            });
            return { requiresOtp: true, email: data.email };
          }

          // Legacy / direct login path (should not occur with OTP enabled)
          set({ isAuthenticated: true, currentUser: data.user, currentCompany: data.company || null, token: data.token, pendingOtpEmail: null });
          if (data.company?.id) get().fetchInitialData(data.company.id);
        } catch (e) { console.error(e); }
      },

      verifyLoginOtp: async (email, code) => {
        try {
          const res = await fetch(API_URL + '/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, type: 'login_otp' }),
          });
          const data = await res.json();
          if (!res.ok) {
            get().addToast(data.error || 'Invalid or expired code', 'error');
            return;
          }
          set({ isAuthenticated: true, currentUser: data.user, currentCompany: data.company || null, token: data.token, pendingOtpEmail: null });
          if (data.company?.id) get().fetchInitialData(data.company.id);
        } catch (e) { console.error(e); }
      },


      logout: () => set({
        isAuthenticated: false, currentUser: null, currentCompany: null,
        token: null, clients: [], leads: [], leadActivities: {}, deals: [], tasks: [], 
        invoices: [], activityLogs: [], team: [], analytics: null,
      }),

      registerCompany: async (companyName, userName, email, password) => {
        const company_id = uuidv4();
        const user_id = uuidv4();
        try {
          const res = await fetch(API_URL + '/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company_id, user_id, company_name: companyName, user_name: userName, email, password, role: 'owner' }),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            get().addToast(errorData.error || 'Registration failed. Please try again.', 'error');
            return { success: false };
          }
          const data = await res.json();
          const subdomain = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          set({
            isAuthenticated: true,
            token: data.token || null,
            currentCompany: {
              id: company_id, name: companyName, status: 'inactive',
              onboarding_step: 'payment',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              subscription_status: 'trialing',
              subdomain,
            },
            currentUser: { id: user_id, company_id, name: userName, email, role: 'owner' },
            clients: [], leads: [], leadActivities: {}, deals: [], tasks: [], invoices: [], activityLogs: [],
          });
          return { success: true, subdomain };
        } catch (e) {
          console.error(e);
          return { success: false };
        }
      },

      loginWithToken: async (token: string) => {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const { user, company } = await res.json();
            set({ isAuthenticated: true, currentUser: user, currentCompany: company, token });
            if (company?.id) {
              get().fetchInitialData(company.id);
            }
            return true;
          }
          return false;
        } catch (e) {
          console.error(e);
          return false;
        }
      },

      updateCompanyOnboarding: (updates) => set((state) => {
        if (!state.currentCompany) return state;
        get().authFetch(`${API_URL}/api/companies/${state.currentCompany.id}`, {
          method: 'PUT', body: JSON.stringify(updates),
        }).catch(console.error);
        return { currentCompany: { ...state.currentCompany, ...updates } };
      }),

      addUser: (user) => set((state) => {
        if (!state.currentCompany) return state;
        const newUser = { ...user, id: uuidv4(), company_id: state.currentCompany.id };
        get().authFetch(API_URL + '/api/users', { method: 'POST', body: JSON.stringify(newUser) })
          .then(() => {
            get().authFetch(`${API_URL}/api/users/${newUser.id}/resend`, { method: 'POST' }).catch(console.error);
          })
          .catch(console.error);
        get().addToast(`${newUser.name} added to team`, 'success');
        return { team: [...state.team, newUser] };
      }),

      deleteUser: (id) => set((state) => {
        get().authFetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' }).catch(console.error);
        get().addToast('Team member removed', 'info');
        return { team: state.team.filter(u => u.id !== id) };
      }),

      resendInvite: async (id) => {
        const toastId = get().addToast('Resending invitation...', 'loading');
        try {
          const res = await get().authFetch(`${API_URL}/api/users/${id}/resend`, { method: 'POST' });
          get().removeToast(toastId);
          get().addToast(res.ok ? 'Invitation resent ✓' : 'Failed to resend invitation', res.ok ? 'success' : 'error');
        } catch {
          get().removeToast(toastId);
          get().addToast('Error resending email', 'error');
        }
      },

      verifyInvite: async (token: string) => {
        try {
          const res = await fetch(`${API_URL}/api/auth/verify-invite?token=${token}`);
          return res.ok;
        } catch (e) {
          console.error(e);
          return false;
        }
      },

      acceptInvite: async (token: string, password: string) => {
        try {
          const res = await fetch(`${API_URL}/api/auth/accept-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          });
          if (res.ok) {
            const { user, company, token: newToken } = await res.json();
            set({ isAuthenticated: true, currentUser: user, currentCompany: company, token: newToken });
            get().fetchInitialData(company.id);
            return true;
          }
          return false;
        } catch (e) {
          console.error(e);
          return false;
        }
      },

      seedSampleData: async () => {
        const state = get();
        if (!state.currentCompany) return;
        try {
          await get().authFetch(`${API_URL}/api/seed/${state.currentCompany.id}`, { method: 'POST' });
          set(s => ({
            currentCompany: s.currentCompany
              ? { ...s.currentCompany, onboarding_step: 'done' }
              : s.currentCompany,
          }));
          get().fetchInitialData(state.currentCompany.id);
        } catch (e) { console.error(e); }
      },

      fetchInitialData: async (companyId: string) => {
        try {
          const safeFetch = async (url: string) => {
            try {
              const res = await get().authFetch(url);
              return res.ok ? await res.json() : null;
            } catch { return null; }
          };

          const [analytics, clients, leads, deals, tasks, invoices, modules, logs, team] = await Promise.all([
            safeFetch(`${API_URL}/api/analytics/${companyId}`),
            safeFetch(`${API_URL}/api/clients/company/${companyId}`),
            safeFetch(`${API_URL}/api/leads/company/${companyId}`),
            safeFetch(`${API_URL}/api/deals/company/${companyId}`),
            safeFetch(`${API_URL}/api/tasks/company/${companyId}`),
            safeFetch(`${API_URL}/api/invoices/company/${companyId}`),
            safeFetch(`${API_URL}/api/modules`),
            safeFetch(`${API_URL}/api/activity-logs/company/${companyId}`),
            safeFetch(`${API_URL}/api/users/company/${companyId}`),
          ]);

          set({
            analytics: analytics || get().analytics,
            clients: Array.isArray(clients) ? clients : get().clients,
            leads: Array.isArray(leads) ? leads : get().leads,
            deals: Array.isArray(deals) ? deals : get().deals,
            tasks: Array.isArray(tasks) ? tasks : get().tasks,
            invoices: Array.isArray(invoices) ? invoices : get().invoices,
            modules: Array.isArray(modules) && modules.length > 0 ? modules : get().modules,
            activityLogs: Array.isArray(logs) ? logs : get().activityLogs,
            team: Array.isArray(team) ? team : get().team,
          });
        } catch (e) { console.error(e); }
      },

      pollActivityLogs: async () => {
        const company = get().currentCompany;
        if (!company) return;
        try {
          const res = await get().authFetch(`${API_URL}/api/activity-logs/company/${company.id}`);
          if (res.ok) {
            const logs = await res.json();
            if (Array.isArray(logs)) {
              set({ activityLogs: logs });
            }
          }
        } catch (e) {
          console.error('Error polling activity logs:', e);
        }
      },
    }),
    {
      name: 'trackam-storage',
      version: 3,
      migrate: (persistedState: any) => {
        return {
          ...persistedState,
          isAuthenticated: false,
          currentUser: null,
          currentCompany: null,
          token: null,
          clients: [],
          leads: [],
          leadActivities: {},
          deals: [],
          tasks: [],
          invoices: [],
          activityLogs: [],
          team: [],
          analytics: null,
          notifications: [],
        };
      },
    }
  )
);
