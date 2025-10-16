
// ============================================================================
// FILE: lib/notifications.ts
// ============================================================================
import { sendWhatsAppMessage as sendWhatsAppMessageNotif } from './whatsapp';

// Configuration for notifications
const OWNER_PHONE_NUMBER = process.env.OWNER_PHONE_NUMBER; // Your WhatsApp number
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL; // Optional email for alerts

interface NotificationPayload {
  type: 'review_needed' | 'error' | 'manual_takeover' | 'high_priority';
  phoneNumber: string;
  customerName?: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function sendOwnerNotification(payload: NotificationPayload): Promise<void> {
  const { type, phoneNumber, customerName, message, metadata } = payload;

  try {
    // Format notification message
    const notificationMessage = formatNotificationMessage(payload);

    // Send WhatsApp notification to owner
    if (OWNER_PHONE_NUMBER) {
      await sendWhatsAppMessageNotif(OWNER_PHONE_NUMBER, notificationMessage);
      console.log(`Notification sent to owner: ${type}`);
    }

    // Optionally send email notification
    if (NOTIFICATION_EMAIL && type === 'high_priority') {
      await sendEmailNotification(NOTIFICATION_EMAIL, payload);
    }

    // Log notification
    await logNotification(payload);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

function formatNotificationMessage(payload: NotificationPayload): string {
  const { type, phoneNumber, customerName, message, metadata } = payload;

  const emoji = {
    review_needed: '⚠️',
    error: '🚨',
    manual_takeover: '👤',
    high_priority: '🔴',
  }[type];

  let notification = `${emoji} *${type.toUpperCase().replace('_', ' ')}*\n\n`;
  notification += `📱 Customer: ${customerName || phoneNumber}\n`;
  notification += `💬 Message: ${message}\n`;

  if (metadata) {
    notification += `\n📋 Details:\n`;
    for (const [key, value] of Object.entries(metadata)) {
      notification += `  • ${key}: ${value}\n`;
    }
  }

  notification += `\n🔗 View: https://your-app.vercel.app`;

  return notification;
}

async function sendEmailNotification(email: string, payload: NotificationPayload): Promise<void> {
  // Implement email sending via SendGrid, Resend, or AWS SES
  // Example with fetch to a hypothetical email API:
  
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'alerts@ilabs.com',
        to: email,
        subject: `WhatsApp Alert: ${payload.type}`,
        html: `
          <h2>WhatsApp Agent Alert</h2>
          <p><strong>Type:</strong> ${payload.type}</p>
          <p><strong>Customer:</strong> ${payload.customerName || payload.phoneNumber}</p>
          <p><strong>Message:</strong> ${payload.message}</p>
          <p><a href="https://your-app.vercel.app">View Dashboard</a></p>
        `,
      }),
    });
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

async function logNotification(payload: NotificationPayload): Promise<void> {
  // Log to database or monitoring service
  console.log('Notification sent:', {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

// Specific notification helpers

export async function notifyReviewNeeded(
  phoneNumber: string,
  customerName: string | undefined,
  reason: string,
  originalMessage: string
): Promise<void> {
  await sendOwnerNotification({
    type: 'review_needed',
    phoneNumber,
    customerName,
    message: originalMessage,
    metadata: {
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function notifyError(
  error: Error,
  context: string,
  phoneNumber?: string
): Promise<void> {
  await sendOwnerNotification({
    type: 'error',
    phoneNumber: phoneNumber || 'system',
    message: error.message,
    metadata: {
      context,
      stack: error.stack?.substring(0, 200),
    },
  });
}

export async function notifyManualTakeover(
  phoneNumber: string,
  customerName: string | undefined,
  triggeredBy: string
): Promise<void> {
  await sendOwnerNotification({
    type: 'manual_takeover',
    phoneNumber,
    customerName,
    message: `Manual control taken over by ${triggeredBy}`,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
}
