// ============================================================================
// FILE: lib/enhancedMessageHandler.ts
// ============================================================================
import { sendWhatsAppMessage as sendWhatsAppMessageOriginal } from './whatsapp';
import { 
  getClaudeResponseWithInvoiceHandling, 
  processInvoiceRequest,
  needsInvoiceDetails 
} from './enhancedClaudeAgent';
import { getConversationState as getConversationStateOriginal, updateConversationState as updateConversationStateOriginal } from './conversationStore';
import { checkIfNeedsReview as checkIfNeedsReviewOriginal } from './reviewTriggers';
import { notifyReviewNeeded, notifyError } from './notifications';

interface IncomingMessageEnhanced {
  phoneNumber: string;
  message: string;
  messageType: string;
  messageId: string;
  timestamp: string;
  senderName?: string;
}

export async function handleIncomingMessageEnhanced(data: IncomingMessageEnhanced) {
  const { phoneNumber, message, senderName } = data;

  try {
    // Get conversation state
    const conversationState = await getConversationStateOriginal(phoneNumber);

    // Check if in manual mode (owner has taken over)
    if (conversationState.controlMode === 'manual') {
      console.log(`Conversation ${phoneNumber} is in manual mode. Skipping AI response.`);
      
      // Update conversation log but don't respond
      await updateConversationStateOriginal(phoneNumber, {
        lastMessage: message,
        lastMessageTime: new Date().toISOString(),
        messageCount: conversationState.messageCount + 1,
        history: [
          ...(conversationState.history || []),
          { role: 'user', content: message, timestamp: new Date().toISOString() },
        ],
      });
      
      return;
    }

    // Check if message needs human review
    const reviewCheck = await checkIfNeedsReviewOriginal(message, conversationState);
    
    if (reviewCheck.needsReview) {
      console.log(`Message needs review: ${reviewCheck.reason}`);
      
      // Update state to flag for review
      await updateConversationStateOriginal(phoneNumber, {
        needsReview: true,
        reviewReason: reviewCheck.reason,
        lastMessage: message,
        lastMessageTime: new Date().toISOString(),
      });
      
      // Notify owner
      await notifyReviewNeeded(
        phoneNumber,
        senderName || conversationState.customerName,
        reviewCheck.reason,
        message
      );
    }

    // Check if this is an invoice request that needs more details
    const invoiceDetailsCheck = needsInvoiceDetails(message, conversationState.history || []);
    
    if (invoiceDetailsCheck.needsBusinessName || invoiceDetailsCheck.needsDate) {
      // Send clarification message
      await sendWhatsAppMessageOriginal(phoneNumber, invoiceDetailsCheck.suggestedResponse);
      
      // Update conversation state
      await updateConversationStateOriginal(phoneNumber, {
        lastMessage: message,
        lastMessageTime: new Date().toISOString(),
        messageCount: conversationState.messageCount + 1,
        history: [
          ...(conversationState.history || []),
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: invoiceDetailsCheck.suggestedResponse, timestamp: new Date().toISOString() },
        ],
      });
      
      return;
    }

    // Get AI response with invoice handling
    const aiResult = await getClaudeResponseWithInvoiceHandling({
      phoneNumber,
      customerName: senderName || conversationState.customerName,
      currentMessage: message,
      conversationHistory: conversationState.history || [],
    });

    // Handle invoice request if detected
    if (aiResult.invoiceRequest?.shouldFetchInvoice) {
      const { businessName, date } = aiResult.invoiceRequest;
      
      if (businessName && date) {
        // First send acknowledgment
        const ackMessage = "Sure thing! One sec while I grab that for you...";
        await sendWhatsAppMessageOriginal(phoneNumber, ackMessage);

        // Process invoice request
        const invoiceResult = await processInvoiceRequest(phoneNumber, businessName, date);
        
        // Send final message
        await sendWhatsAppMessageOriginal(phoneNumber, invoiceResult.message);

        // Update conversation state
        await updateConversationStateOriginal(phoneNumber, {
          customerName: senderName || conversationState.customerName,
          lastMessage: message,
          lastMessageTime: new Date().toISOString(),
          messageCount: conversationState.messageCount + 1,
          history: [
            ...(conversationState.history || []),
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            { role: 'assistant', content: ackMessage, timestamp: new Date().toISOString() },
            { role: 'assistant', content: invoiceResult.message, timestamp: new Date().toISOString() },
          ],
        });

        console.log(`Invoice processed for ${phoneNumber}: ${invoiceResult.success ? 'Success' : 'Failed'}`);
        return;
      }
    }

    // Send normal AI response
    await sendWhatsAppMessageOriginal(phoneNumber, aiResult.message);

    // Update conversation state
    await updateConversationStateOriginal(phoneNumber, {
      customerName: senderName || conversationState.customerName,
      lastMessage: message,
      lastMessageTime: new Date().toISOString(),
      messageCount: conversationState.messageCount + 1,
      history: [
        ...(conversationState.history || []),
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResult.message, timestamp: new Date().toISOString() },
      ],
    });

    console.log(`Responded to ${phoneNumber} with AI message`);

  } catch (error) {
    console.error('Error handling message:', error);
    
    // Notify owner of error
    await notifyError(error as Error, 'Message handling', phoneNumber);

    // Send fallback message to customer
    try {
      await sendWhatsAppMessageOriginal(
        phoneNumber,
        "I apologize, but I'm having a technical issue. Let me connect you with our team right away."
      );
      
      // Flag for manual review
      await updateConversationStateOriginal(phoneNumber, {
        needsReview: true,
        reviewReason: 'System error occurred',
        controlMode: 'manual', // Auto-switch to manual on error
      });
    } catch (fallbackError) {
      console.error('Failed to send fallback message:', fallbackError);
    }
  }
}
