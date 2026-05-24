"use client";

import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useStore } from '@/lib/store';

interface PaymentButtonProps {
  amount: number;
  email: string;
  metadata: any;
  onSuccess: (reference: string) => void;
  label?: string;
  className?: string;
}

export function PaymentButton({ amount, email, metadata, onSuccess, label = "Pay Now", className }: PaymentButtonProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const { addToast } = useStore();

  const handlePaystackSuccess = (reference: any) => {
    addToast("Payment verified! Initializing your workspace...", "success");
    const refStr = reference?.reference || reference || "success_ref";
    onSuccess(refStr);
  };

  const handlePaystackClose = () => {
    addToast("Payment cancelled", "info");
  };

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email || 'customer@example.com',
    amount: amount * 100, // Paystack works in Kobo
    publicKey: publicKey || '',
    metadata: metadata,
    onSuccess: handlePaystackSuccess,
    onClose: handlePaystackClose,
  };

  const initializePayment = usePaystackPayment(config);

  const handleMockPayment = () => {
    addToast("Running Mock Payment...", "loading");
    setTimeout(() => {
      onSuccess("mock_ref_" + Math.random().toString(36).substring(7));
      addToast("Mock Payment Successful!", "success");
    }, 2000);
  };

  if (!publicKey) {
    return (
      <button 
        onClick={handleMockPayment}
        className={`bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors ${className}`}
      >
        {label} (Mock)
      </button>
    );
  }

  return (
    <button 
      onClick={() => initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose })}
      className={`bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors ${className}`}
    >
      {label}
    </button>
  );
}
