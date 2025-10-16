/ ============================================================================
// FILE: lib/whatsapp.ts
// ============================================================================
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('Message sent successfully:', data);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  caption?: string,
  filename?: string
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'document',
        document: {
          link: documentUrl,
          caption: caption,
          filename: filename,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      throw new Error(`Failed to send document: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('Document sent successfully:', data);
  } catch (error) {
    console.error('Error sending WhatsApp document:', error);
    throw error;
  }
}

export async function uploadMediaToWhatsApp(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/media`;

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('file', blob, 'document.pdf');
  formData.append('messaging_product', 'whatsapp');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp media upload error:', error);
      throw new Error(`Failed to upload media: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.id; // Returns media ID
  } catch (error) {
    console.error('Error uploading media to WhatsApp:', error);
    throw error;
  }
}

export async function sendWhatsAppMediaById(
  to: string,
  mediaId: string,
  type: 'document' | 'image' | 'video',
  caption?: string
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;

  const mediaObject: any = { id: mediaId };
  if (caption) {
    mediaObject.caption = caption;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: type,
        [type]: mediaObject,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      throw new Error(`Failed to send media: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('Media sent successfully:', data);
  } catch (error) {
    console.error('Error sending WhatsApp media:', error);
    throw error;
  }
}