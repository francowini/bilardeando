/**
 * WhatsApp service interface + mock implementation.
 * Abstracts the WhatsApp Business API provider (Gupshup, 360dialog, etc.).
 * Use MockWhatsAppService for development; swap in a real implementation later.
 */

// ── Types ──

export interface WhatsAppMessage {
  from: string; // phone number (E.164 format, e.g. "+5491155551234")
  body: string; // message text
  timestamp: Date;
}

// ── Service Interface ──

export interface WhatsAppService {
  /** Send a text message to a WhatsApp number */
  sendMessage(to: string, message: string): Promise<void>;

  /** Parse an incoming webhook payload into our internal message format */
  parseIncomingMessage(rawBody: unknown): WhatsAppMessage;
}

// ── Mock Implementation ──

/**
 * Mock WhatsApp service that logs messages to console.
 * Used for development and testing without a real WhatsApp Business API provider.
 */
export class MockWhatsAppService implements WhatsAppService {
  async sendMessage(to: string, message: string): Promise<void> {
    console.log(`[MockWhatsApp] Sending to ${to}:`);
    console.log(message);
    console.log("---");
  }

  parseIncomingMessage(rawBody: unknown): WhatsAppMessage {
    // Accept a simple JSON shape: { from, body, timestamp? }
    const body = rawBody as Record<string, unknown>;

    if (!body || typeof body.from !== "string" || typeof body.body !== "string") {
      throw new Error("Invalid incoming WhatsApp message format");
    }

    return {
      from: body.from,
      body: body.body,
      timestamp: body.timestamp ? new Date(body.timestamp as string) : new Date(),
    };
  }
}

// ── Real Implementation (placeholder for Gupshup / 360dialog) ──

/**
 * Future: Real WhatsApp Business API implementation.
 * Will use Gupshup, 360dialog, or Meta Cloud API.
 */
// export class GupshupWhatsAppService implements WhatsAppService { ... }

// ── Singleton Accessor ──

let whatsAppServiceInstance: WhatsAppService | null = null;

/**
 * Get the WhatsApp service singleton.
 * Returns MockWhatsAppService unless a real provider is configured.
 */
export function getWhatsAppService(): WhatsAppService {
  if (!whatsAppServiceInstance) {
    // Future: check for WHATSAPP_API_KEY or similar env var to decide
    // which implementation to use. For now, always use mock.
    whatsAppServiceInstance = new MockWhatsAppService();
  }
  return whatsAppServiceInstance;
}
