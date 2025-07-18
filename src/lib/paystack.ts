// src/lib/paystack.ts
export const PAYSTACK_CONFIG = {
  publicKey:
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    "pk_test_your_public_key_here",
  secretKey: process.env.PAYSTACK_SECRET_KEY || "sk_test_your_secret_key_here",
  baseUrl: "https://api.paystack.co",
};

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface PaystackCustomer {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface PaystackTransaction {
  email: string;
  amount: number; // Amount in kobo (multiply naira by 100)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: any;
  };
  channels?: string[];
}

export class PaystackService {
  private static instance: PaystackService;

  static getInstance(): PaystackService {
    if (!PaystackService.instance) {
      PaystackService.instance = new PaystackService();
    }
    return PaystackService.instance;
  }

  // Generate a unique reference for each transaction
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `prep_${timestamp}_${random}`;
  }

  // Initialize payment
  async initializePayment(
    transaction: PaystackTransaction
  ): Promise<PaystackResponse> {
    try {
      const response = await fetch(
        `${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...transaction,
            reference: transaction.reference || this.generateReference(),
            currency: transaction.currency || "NGN",
            channels: transaction.channels || [
              "card",
              "bank",
              "ussd",
              "qr",
              "mobile_money",
              "bank_transfer",
            ],
          }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack initialization error:", error);
      return {
        status: false,
        message: "Failed to initialize payment",
      };
    }
  }

  // Verify payment
  async verifyPayment(reference: string): Promise<PaystackResponse> {
    try {
      const response = await fetch(
        `${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack verification error:", error);
      return {
        status: false,
        message: "Failed to verify payment",
      };
    }
  }

  // Create customer
  async createCustomer(customer: PaystackCustomer): Promise<PaystackResponse> {
    try {
      const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/customer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack customer creation error:", error);
      return {
        status: false,
        message: "Failed to create customer",
      };
    }
  }

  // Get transaction list
  async getTransactions(params?: {
    page?: number;
    perPage?: number;
    customer?: string;
    status?: "failed" | "success" | "abandoned";
    from?: string;
    to?: string;
  }): Promise<PaystackResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.perPage)
        queryParams.append("perPage", params.perPage.toString());
      if (params?.customer) queryParams.append("customer", params.customer);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.from) queryParams.append("from", params.from);
      if (params?.to) queryParams.append("to", params.to);

      const response = await fetch(
        `${PAYSTACK_CONFIG.baseUrl}/transaction?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack transactions fetch error:", error);
      return {
        status: false,
        message: "Failed to fetch transactions",
      };
    }
  }

  // Format amount for display (convert kobo to naira)
  formatAmount(amountInKobo: number): string {
    const amountInNaira = amountInKobo / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amountInNaira);
  }

  // Convert naira to kobo
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }
}

export const paystackService = PaystackService.getInstance();
