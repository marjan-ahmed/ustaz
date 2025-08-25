import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Platform commission rate (10%)
export const PLATFORM_COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || '0.10');

// Calculate amounts for platform and provider
export const calculateAmounts = (totalAmount: number) => {
  const platformFee = Math.round(totalAmount * PLATFORM_COMMISSION_RATE);
  const providerAmount = totalAmount - platformFee;
  
  return {
    totalAmount,
    platformFee,
    providerAmount,
  };
};

// Create a payment intent with platform fee
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'pkr',
  metadata: Record<string, string> = {}
) => {
  const { platformFee, providerAmount } = calculateAmounts(amount);
  
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      ...metadata,
      platformFee: platformFee.toString(),
      providerAmount: providerAmount.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
};

// Create a transfer to provider (after successful payment)
export const transferToProvider = async (
  amount: number,
  providerStripeAccountId: string,
  paymentIntentId: string
) => {
  return await stripe.transfers.create({
    amount,
    currency: 'pkr',
    destination: providerStripeAccountId,
    transfer_group: paymentIntentId,
  });
};