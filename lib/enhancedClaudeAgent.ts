// lib/enhancedClaudeAgent.ts
import Anthropic from '@anthropic-ai/sdk';
import { sendWhatsAppMessage } from './whatsapp';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a WhatsApp Customer Service Agent for iLabs Pharmaceuticals. Your job is to handle incoming messages from customers, assist with basic inquiries, and provide helpful information.

Always be professional, polite, and concise. Use natural, conversational language while staying accurate and brand-consistent.

Core Instructions:

1. Message Handling
   * Greet each customer warmly by name if available.
   * Identify the customer's intent (order inquiry, product question, invoice request, etc.).
   * Provide direct, relevant responses — do not over-explain.
   * If the customer asks about a product, provide the official product link or menu.

2. Invoice Requests
   * When a customer requests their invoice, let them know you'll help them get it
   * For now, inform them that invoice retrieval is being set up and you'll forward their request to the team
   * Collect business name and date for future use

3. Tone & Style
   * Always friendly, confident, and efficient.
   * Use a maximum of two short paragraphs per message.
   * End chats with helpful closings such as:
      * "Thanks for checking in! Let me know if you'd like to place another order."
      * "I've noted your invoice request and our team will send it shortly."`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequestParams {
  phoneNumber: string;
  customerName?: string;
  currentMessage: string;
  conversationHistory: Array<{ role: string; content: string; timestamp: string }>;
}

interface InvoiceRequest {
  businessName?: string;
  date?: string;
  shouldFetchInvoice: boolean;
}

export async function getClaudeResponseWithInvoiceHandling(
  params: ClaudeRequestParams
): Promise<{ message: string; invoiceRequest?: InvoiceRequest }> {
  const { customerName, currentMessage, conversationHistory } = params;

  // Build conversation context
  const messages: Message[] = conversationHistory.slice(-10).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  try {
    // Check if this is an invoice request
    const invoiceRequest = extractInvoiceRequest(currentMessage, conversationHistory);

    // Get AI response
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages as any,
    });

    const assistantMessage = response.content[0];
    
    if (assistantMessage.type !== 'text') {
      return {
        message: "I'm here to help! How can I assist you today?",
      };
    }

    let responseText = assistantMessage.text;

    // If invoice requested, acknowledge it
    if (invoiceRequest.shouldFetchInvoice && invoiceRequest.businessName) {
      return {
        message: responseText,
        invoiceRequest: invoiceRequest,
      };
    }

    return { message: responseText };
  } catch (error) {
    console.error('Claude API error:', error);
    return {
      message: "I apologize, but I'm having trouble processing your request right now. Let me connect you with our team.",
    };
  }
}

// Enhanced invoice extraction from conversation
function extractInvoiceRequest(
  currentMessage: string,
  conversationHistory: Array<{ role: string; content: string; timestamp: string }>
): InvoiceRequest {
  const lowerMessage = currentMessage.toLowerCase();
  
  // Check if this is an invoice request
  const isInvoiceRequest = /invoice|receipt|bill|statement/i.test(currentMessage);
  
  if (!isInvoiceRequest) {
    return { shouldFetchInvoice: false };
  }

  // Extract business name
  let businessName: string | undefined;
  
  const patterns = [
    /(?:for|from)\s+([A-Z][A-Za-z\s&]+?)(?:\s+from|\s+dated|$)/,
    /business name[:\s]+([A-Za-z\s&]+)/i,
    /company[:\s]+([A-Za-z\s&]+)/i,
  ];

  for (const pattern of patterns) {
    const match = currentMessage.match(pattern);
    if (match) {
      businessName = match[1].trim();
      break;
    }
  }

  // Extract date/period
  let date: string | undefined;
  
  if (/last week/i.test(currentMessage)) {
    date = 'last week';
  } else if (/yesterday/i.test(currentMessage)) {
    date = 'yesterday';
  } else if (/last month/i.test(currentMessage)) {
    date = 'last month';
  } else if (/this month/i.test(currentMessage)) {
    date = 'this month';
  } else {
    const dateMatch = currentMessage.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
    if (dateMatch) {
      date = dateMatch[1];
    }
  }

  const shouldFetchInvoice = !!(businessName && date);

  return {
    businessName,
    date,
    shouldFetchInvoice,
  };
}

// Process invoice request (without Xero, just acknowledge)
export async function processInvoiceRequest(
  phoneNumber: string,
  businessName: string,
  date: string
): Promise<{ success: boolean; message: string }> {
  try {
    // For now, just acknowledge the request
    console.log(`Invoice requested by ${phoneNumber} for ${businessName} from ${date}`);
    
    return {
      success: true,
      message: `I've noted your request for ${businessName}'s invoice from ${date}. Our team will send it to you shortly. If you need it urgently, please let me know!`,
    };
  } catch (error) {
    console.error('Error processing invoice request:', error);
    return {
      success: false,
      message: "I'm having trouble with that request right now. Let me connect you with our accounts team who can help you directly.",
    };
  }
}

// Helper to determine if message needs clarification
export function needsInvoiceDetails(message: string, conversationHistory: any[]): { 
  needsBusinessName: boolean; 
  needsDate: boolean;
  suggestedResponse: string;
} {
  const request = extractInvoiceRequest(message, conversationHistory);
  
  const needsBusinessName = !request.businessName;
  const needsDate = !request.date;

  let suggestedResponse = '';

  if (needsBusinessName && needsDate) {
    suggestedResponse = "Sure thing! To pull up your invoice, I'll need:\n1. Your business/company name\n2. Approximate date or period (e.g., 'last week', 'March 2024')";
  } else if (needsBusinessName) {
    suggestedResponse = "Sure! What's your business or company name?";
  } else if (needsDate) {
    suggestedResponse = "Got it! When was the invoice dated? (e.g., 'last week', 'March 15')";
  }

  return {
    needsBusinessName,
    needsDate,
    suggestedResponse,
  };
}