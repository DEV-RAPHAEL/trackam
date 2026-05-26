import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}



export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(dateString: string | undefined | null) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  return format(d, 'MMM d, HH:mm');
}

export function getInvoiceEffectiveStatus(invoice: { type?: string; status: string; due_date: string }) {
  if (invoice.type === 'retainer' && invoice.status === 'unpaid') {
    const now = new Date();
    const dueDate = new Date(invoice.due_date);
    
    // Reset to start of months for clean comparison
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const dueMonthStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
    
    if (dueMonthStart > currentMonthStart) {
      return 'paid';
    }
  }
  return invoice.status;
}
