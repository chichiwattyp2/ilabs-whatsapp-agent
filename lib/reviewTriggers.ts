interface ReviewResult {
  needsReview: boolean;
  reason?: string;
}

interface ConversationState {
  phoneNumber: string;
  messageCount: number;
  history: Array<{ role: string; content: string; timestamp: string }>;
}

export async function checkIfNeedsReview(
  message: string,
  conversationState: ConversationState
): Promise<ReviewResult> {
  
  if (isComplaint(message)) {
    return {
      needsReview: true,
      reason: 'Customer complaint detected',
    };
  }

  if (isRefundRequest(message)) {
    return {
      needsReview: true,
      reason: 'Refund or return request',
    };
  }

  if (isPricingNegotiation(message)) {
    return {
      needsReview: true,
      reason: 'Pricing or discount negotiation',
    };
  }

  if (isUrgent(message)) {
    return {
      needsReview: true,
      reason: 'Urgent request detected',
    };
  }

  if (conversationState.messageCount > 8) {
    return {
      needsReview: true,
      reason: 'Extended conversation - may need human touch',
    };
  }

  return { needsReview: false };
}

function isComplaint(message: string): boolean {
  const complaintKeywords = [
    'disappointed', 'terrible', 'worst', 'horrible', 'awful',
    'unacceptable', 'frustrated', 'angry', 'unhappy', 'dissatisfied',
  ];

  const lowerMessage = message.toLowerCase();
  return complaintKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isRefundRequest(message: string): boolean {
  const refundKeywords = ['refund', 'return', 'money back', 'cancel order'];
  const lowerMessage = message.toLowerCase();
  return refundKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isPricingNegotiation(message: string): boolean {
  const pricingKeywords = ['discount', 'cheaper', 'lower price', 'better deal'];
  const lowerMessage = message.toLowerCase();
  return pricingKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isUrgent(message: string): boolean {
  const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'right now'];
  const lowerMessage = message.toLowerCase();
  return urgentKeywords.some(keyword => lowerMessage.includes(keyword));
}
