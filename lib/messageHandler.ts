// ============================================================================
// FILE: lib/messageHandler.ts
// ============================================================================
import { sendWhatsAppMessage } from './whatsapp';
import { getClaudeResponse } from './claudeAgent';
import { getConversationState, updateConversationState } from './conversationStore';
import { checkIfNeedsReview } from './reviewTriggers';

interface IncomingMessage {
  phoneNumber: string;
  message: string;
  messageType: string;
  messageId: string;
  timestamp: string;
  senderName?: string;
}

export async function handleIncomingMessage(data: IncomingMessage) {
  const { phoneNumber, message, senderName } = data;

  // Get conversation state
  const conversationState = await getConversationState(phoneNumber);

  // Check if in manual mode (owner has taken over)
  if (conversationState.controlMode === 'manual') {
    console.log(`Conversation ${phoneNumber} is in manual mode. Skipping AI response.`);
    
    // Update conversation log but don't respond
    await updateConversationState(phoneNumber, {
      lastMessage: message,
      lastMessageTime: new Date().toISOString(),
      messageCount: conversationState.messageCount + 1,
    });
    
    return;
  }

  // Check if message needs human review
  const reviewCheck = await checkIfNeedsReview(message, conversationState);
  
  if (reviewCheck.needsReview) {
    console.log(`Message needs review: ${reviewCheck.reason}`);
    
    // Update state to flag for review
    await updateConversationState(phoneNumber, {
      needsReview: true,
      reviewReason: reviewCheck.reason,
      lastMessage: message,
      lastMessageTime: new Date().toISOString(),
    });
    
    // Still respond, but notify owner
    // You could implement a notification system here (email, SMS, etc.)
  }

  // Get AI response from Claude
  const aiResponse = await getClaudeResponse({
    phoneNumber,
    customerName: senderName || conversationState.customerName,
    currentMessage: message,
    conversationHistory: conversationState.history || [],
  });

  // Send response via WhatsApp
  await sendWhatsAppMessage(phoneNumber, aiResponse);

  // Update conversation state
  await updateConversationState(phoneNumber, {
    customerName: senderName || conversationState.customerName,
    lastMessage: message,
    lastMessageTime: new Date().toISOString(),
    messageCount: conversationState.messageCount + 1,
    history: [
      ...(conversationState.history || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ],
  });

  console.log(`Responded to ${phoneNumber} with AI message`);
}