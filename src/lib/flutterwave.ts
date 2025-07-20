// src/lib/flutterwave.ts
export const FLUTTERWAVE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  baseUrl: "https://api.flutterwave.com/v3",
};

export interface FlutterwaveResponse {
  status: string;
  message: string;
  data?: any;
}

export interface FlutterwaveCustomer {
  email: string;
  name?: string;
  phonenumber?: string;
}

export interface FlutterwaveTransaction {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url?: string;
  payment_options?: string;
  customer: FlutterwaveCustomer;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: {
    [key: string]: any;
  };
}

export class FlutterwaveService {
  private static instance: FlutterwaveService;

  static getInstance(): FlutterwaveService {
    if (!FlutterwaveService.instance) {
      FlutterwaveService.instance = new FlutterwaveService();
    }
    return FlutterwaveService.instance;
  }

  // Generate a unique transaction reference
  generateTxRef(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `prep_${timestamp}_${random}`;
  }

  // Initialize payment with Flutterwave
  async initializePayment(
    transaction: FlutterwaveTransaction
  ): Promise<FlutterwaveResponse> {
    try {
      const response = await fetch(`${FLUTTERWAVE_CONFIG.baseUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FLUTTERWAVE_CONFIG.secretKey}`,
        },
        body: JSON.stringify(transaction),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment initialization failed");
      }

      return {
        status: data.status,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.error("Flutterwave initialization error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Payment initialization failed"
      );
    }
  }

  // Verify payment with Flutterwave
  async verifyPayment(transactionId: string): Promise<FlutterwaveResponse> {
    try {
      const response = await fetch(
        `${FLUTTERWAVE_CONFIG.baseUrl}/transactions/${transactionId}/verify`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FLUTTERWAVE_CONFIG.secretKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment verification failed");
      }

      return {
        status: data.status,
        message: data.message,
        data: data.data,
      };
    } catch (error) {
      console.error("Flutterwave verification error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Payment verification failed"
      );
    }
  }

  // Convert Naira to Kobo (Flutterwave uses base units)
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  // Convert Kobo to Naira
  koboToNaira(kobo: number): number {
    return kobo / 100;
  }

  // Validate webhook signature
  validateWebhookSignature(payload: string, signature: string): boolean {
    // Note: For proper webhook validation, use crypto module on server-side
    // This is a simplified version - implement proper HMAC validation in production
    return true; // Placeholder - implement actual validation
  }

  // Format payment link for redirect
  formatPaymentLink(link: string): string {
    return link;
  }

  // Handle payment errors
  handlePaymentError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred during payment processing";
  }

  // Get transaction status
  getTransactionStatus(data: any): "success" | "failed" | "pending" {
    if (data.status === "successful") return "success";
    if (data.status === "failed") return "failed";
    return "pending";
  }

  // Create payment metadata
  createPaymentMetadata(userId: string, planType: string, additional?: any) {
    return {
      userId,
      planType,
      platform: "PREP",
      timestamp: new Date().toISOString(),
      ...additional,
    };
  }
}

// Export singleton instance
export const flutterwaveService = FlutterwaveService.getInstance();
