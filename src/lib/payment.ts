// src/lib/payment.ts
// Stripe payment integration for access codes

import { loadStripe, Stripe } from '@stripe/stripe-js';

interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  examCategory: "RN" | "RM" | "RPHN";
  papers: ("paper-1" | "paper-2")[];
  validityDays: number;
  features: string[];
}

interface PaymentSession {
  sessionId: string;
  url: string;
  success: boolean;
  error?: string;
}

class PaymentManager {
  private stripe: Stripe | null = null;
  private initialized = false;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    try {
      if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        this.stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        this.initialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  /**
   * Available payment products
   */
  getAvailableProducts(): PaymentProduct[] {
    return [
      {
        id: 'rn-complete-access',
        name: 'RN Complete Access',
        description: 'Full access to RN Paper 1 & Paper 2 with 10,000+ questions',
        price: 2999, // $29.99 in cents
        currency: 'usd',
        examCategory: 'RN',
        papers: ['paper-1', 'paper-2'],
        validityDays: 90,
        features: [
          '250 questions per exam attempt',
          'AI-powered help for missed questions',
          'Detailed explanations and study tips',
          'Performance analytics',
          '90 days access',
          'Mobile compatible'
        ]
      },
      {
        id: 'rn-paper-1-only',
        name: 'RN Paper 1 Access',
        description: 'Access to RN Paper 1 with 5,000+ questions',
        price: 1999, // $19.99 in cents
        currency: 'usd',
        examCategory: 'RN',
        papers: ['paper-1'],
        validityDays: 60,
        features: [
          '250 questions per exam attempt',
          'AI-powered help for missed questions',
          'Detailed explanations',
          '60 days access'
        ]
      },
      {
        id: 'rn-paper-2-only',
        name: 'RN Paper 2 Access',
        description: 'Access to RN Paper 2 with 5,000+ questions',
        price: 1999, // $19.99 in cents
        currency: 'usd',
        examCategory: 'RN',
        papers: ['paper-2'],
        validityDays: 60,
        features: [
          '250 questions per exam attempt',
          'AI-powered help for missed questions',
          'Advanced level questions',
          '60 days access'
        ]
      },
      {
        id: 'rm-complete-access',
        name: 'RM Complete Access',
        description: 'Full access to RM Paper 1 & Paper 2 with 6,000+ questions',
        price: 2499, // $24.99 in cents
        currency: 'usd',
        examCategory: 'RM',
        papers: ['paper-1', 'paper-2'],
        validityDays: 90,
        features: [
          '250 questions per exam attempt',
          'Midwifery-specific content',
          'AI-powered assistance',
          '90 days access'
        ]
      },
      {
        id: 'rphn-complete-access',
        name: 'RPHN Complete Access',
        description: 'Full access to RPHN Paper 1 & Paper 2 with 4,000+ questions',
        price: 2199, // $21.99 in cents
        currency: 'usd',
        examCategory: 'RPHN',
        papers: ['paper-1', 'paper-2'],
        validityDays: 90,
        features: [
          '250 questions per exam attempt',
          'Public health focused content',
          'AI-powered assistance',
          '90 days access'
        ]
      }
    ];
  }

  /**
   * Create payment session for a product
   */
  async createPaymentSession(productId: string, userEmail: string): Promise<PaymentSession> {
    try {
      const product = this.getAvailableProducts().find(p => p.id === productId);
      if (!product) {
        return {
          sessionId: '',
          url: '',
          success: false,
          error: 'Product not found'
        };
      }

      // Call your backend API to create Stripe session
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userEmail,
          product
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        return {
          sessionId: '',
          url: '',
          success: false,
          error: session.error || 'Failed to create payment session'
        };
      }

      return {
        sessionId: session.id,
        url: session.url,
        success: true
      };

    } catch (error) {
      console.error('Payment session creation error:', error);
      return {
        sessionId: '',
        url: '',
        success: false,
        error: 'Failed to create payment session'
      };
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(sessionId: string): Promise<boolean> {
    if (!this.stripe) {
      console.error('Stripe not initialized');
      return false;
    }

    try {
      const { error } = await this.stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Checkout redirect error:', error);
      return false;
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  }

  /**
   * Validate access code
   */
  async validateAccessCode(code: string): Promise<{
    valid: boolean;
    accessCode?: any;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/validate-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate access code'
      };
    }
  }

  /**
   * Redeem access code for user
   */
  async redeemAccessCode(code: string, userId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/redeem-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to redeem access code'
      };
    }
  }
}

// Export singleton instance
export const paymentManager = new PaymentManager();
