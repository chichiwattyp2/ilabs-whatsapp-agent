

// ============================================================================
// FILE: lib/reviewTriggers.ts
// ============================================================================

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
  
  // 1. Check for complaint or negative sentiment
  if (isComplaint(message)) {
    return {
      needsReview: true,
      reason: 'Customer complaint detected',
    };
  }

  // 2. Check for refund/return requests
  if (isRefundRequest(message)) {
    return {
      needsReview: true,
      reason: 'Refund or return request',
    };
  }

  // 3. Check for pricing negotiations or discounts
  if (isPricingNegotiation(message)) {
    return {
      needsReview: true,
      reason: 'Pricing or discount negotiation',
    };
  }

  // 4. Check for urgent/emergency keywords
  if (isUrgent(message)) {
    return {
      needsReview: true,
      reason: 'Urgent request detected',
    };
  }

  // 5. Check for complex technical questions
  if (isComplexQuestion(message)) {
    return {
      needsReview: true,
      reason: 'Complex technical query',
    };
  }

  // 6. Check for bulk or special orders
  if (isBulkOrder(message)) {
    return {
      needsReview: true,
      reason: 'Bulk or special order request',
    };
  }

  // 7. Check for payment issues
  if (isPaymentIssue(message)) {
    return {
      needsReview: true,
      reason: 'Payment issue reported',
    };
  }

  // 8. Check for repeated messages (customer might be frustrated)
  if (isRepeatedMessage(message, conversationState)) {
    return {
      needsReview: true,
      reason: 'Customer repeating the same question',
    };
  }

  // 9. Check for conversation going in circles (more than 8 messages)
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
    'disappointed',
    'terrible',
    'worst',
    'horrible',
    'awful',
    'unacceptable',
    'frustrated',
    'angry',
    'unhappy',
    'dissatisfied',
    'poor service',
    'bad quality',
    'complain',
    'never ordering again',
  ];

  const lowerMessage = message.toLowerCase();
  return complaintKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isRefundRequest(message: string): boolean {
  const refundKeywords = ['refund', 'return', 'money back', 'cancel order', 'send back'];
  const lowerMessage = message.toLowerCase();
  return refundKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isPricingNegotiation(message: string): boolean {
  const pricingKeywords = [
    'discount',
    'cheaper',
    'lower price',
    'reduce the price',
    'better deal',
    'price match',
    'can you do better',
    'negotiate',
  ];

  const lowerMessage = message.toLowerCase();
  return pricingKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isUrgent(message: string): boolean {
  const urgentKeywords = [
    'urgent',
    'emergency',
    'asap',
    'immediately',
    'right now',
    'critical',
    'important',
    'need it today',
  ];

  const lowerMessage = message.toLowerCase();
  return urgentKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isComplexQuestion(message: string): boolean {
  // Check for multiple questions or very long messages
  const questionMarks = (message.match(/\?/g) || []).length;
  const wordCount = message.split(/\s+/).length;

  if (questionMarks >= 3) return true;
  if (wordCount > 100) return true;

  const complexKeywords = [
    'side effects',
    'interaction',
    'contraindication',
    'prescription',
    'dosage',
    'medical advice',
    'doctor',
    'allergic',
  ];

  const lowerMessage = message.toLowerCase();
  return complexKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isBulkOrder(message: string): boolean {
  const bulkKeywords = [
    'bulk order',
    'wholesale',
    'large quantity',
    'business order',
    'corporate',
    '100+',
    '50+',
    'cases',
  ];

  const lowerMessage = message.toLowerCase();
  
  // Check for large numbers
  const numberMatch = message.match(/(\d+)/);
  if (numberMatch && parseInt(numberMatch[1]) >= 50) {
    return true;
  }

  return bulkKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isPaymentIssue(message: string): boolean {
  const paymentKeywords = [
    'payment failed',
    'card declined',
    'transaction error',
    "can't pay",
    'payment not going through',
    'billing issue',
    'charged twice',
    'wrong amount',
  ];

  const lowerMessage = message.toLowerCase();
  return paymentKeywords.some(keyword => lowerMessage.includes(keyword));
}

function isRepeatedMessage(message: string, state: ConversationState): boolean {
  if (state.history.length < 2) return false;

  // Check last 3 user messages
  const recentUserMessages = state.history
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content.toLowerCase());

  const currentLower = message.toLowerCase();

  // Check if current message is very similar to recent ones
  return recentUserMessages.some(msg => {
    const similarity = calculateSimilarity(msg, currentLower);
    return similarity > 0.7; // 70% similar
  });
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
