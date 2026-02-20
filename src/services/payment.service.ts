import type { PaymentLink, PaymentResult } from "@/types";

/**
 * Payment service interface — abstracts Mercado Pago integration.
 * Use MockPaymentService for development/demo, MercadoPagoPaymentService for production.
 */
export interface PaymentService {
  /** Create a Checkout Pro payment link */
  createPaymentLink(params: {
    title: string;
    description: string;
    amountArs: number;
    externalReference: string; // maps back to our Transaction id
    backUrls?: {
      success?: string;
      failure?: string;
      pending?: string;
    };
  }): Promise<PaymentLink>;

  /** Process a webhook notification and return the payment result */
  handleWebhook(paymentId: string): Promise<PaymentResult>;

  /** Check payment status */
  getPaymentStatus(paymentId: string): Promise<PaymentResult>;
}

/**
 * Mock payment service for development and demo.
 * Generates fake payment links and auto-approves payments.
 */
export class MockPaymentService implements PaymentService {
  async createPaymentLink(params: {
    title: string;
    description: string;
    amountArs: number;
    externalReference: string;
    backUrls?: {
      success?: string;
      failure?: string;
      pending?: string;
    };
  }): Promise<PaymentLink> {
    const preferenceId = `mock_pref_${Date.now()}_${params.externalReference}`;
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const successUrl = params.backUrls?.success ?? `${baseUrl}/wallet`;

    return {
      preferenceId,
      initPoint: `${baseUrl}/api/webhooks/mercadopago/mock?pref=${preferenceId}&amount=${params.amountArs}&redirect=${encodeURIComponent(successUrl)}`,
    };
  }

  async handleWebhook(paymentId: string): Promise<PaymentResult> {
    // Mock always approves
    return {
      paymentId,
      status: "approved",
      amountArs: 0, // caller should look up from their records
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return {
      paymentId,
      status: "approved",
      amountArs: 0,
    };
  }
}

/**
 * Real Mercado Pago service using Checkout Pro.
 * Uses the mercadopago SDK v2 for creating preferences.
 */
export class MercadoPagoPaymentService implements PaymentService {
  async createPaymentLink(params: {
    title: string;
    description: string;
    amountArs: number;
    externalReference: string;
    backUrls?: {
      success?: string;
      failure?: string;
      pending?: string;
    };
  }): Promise<PaymentLink> {
    const { MercadoPagoConfig, Preference } = await import("mercadopago");

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const preference = new Preference(client);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const result = await preference.create({
      body: {
        items: [
          {
            id: params.externalReference,
            title: params.title,
            description: params.description,
            quantity: 1,
            unit_price: params.amountArs,
            currency_id: "ARS",
          },
        ],
        external_reference: params.externalReference,
        back_urls: {
          success: params.backUrls?.success ?? `${baseUrl}/wallet?status=success`,
          failure: params.backUrls?.failure ?? `${baseUrl}/wallet?status=failure`,
          pending: params.backUrls?.pending ?? `${baseUrl}/wallet?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      },
    });

    return {
      preferenceId: result.id!,
      initPoint: result.init_point!,
    };
  }

  async handleWebhook(paymentId: string): Promise<PaymentResult> {
    const { MercadoPagoConfig, Payment } = await import("mercadopago");

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    const statusMap: Record<string, PaymentResult["status"]> = {
      approved: "approved",
      rejected: "rejected",
      pending: "pending",
      in_process: "pending",
    };

    return {
      paymentId: String(result.id),
      status: statusMap[result.status ?? ""] ?? "pending",
      amountArs: result.transaction_amount ?? 0,
    };
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return this.handleWebhook(paymentId);
  }
}

// ── Singleton accessor ──

let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentServiceInstance) {
    const useMock =
      !process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN === "your-mercadopago-access-token";
    paymentServiceInstance = useMock
      ? new MockPaymentService()
      : new MercadoPagoPaymentService();
  }
  return paymentServiceInstance;
}
