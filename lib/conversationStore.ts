// lib/conversationStore.ts
interface ConversationState {
  phoneNumber: string;
  customerName?: string;
  controlMode: 'ai' | 'manual';
  needsReview: boolean;
  reviewReason?: string;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

const conversationStore = new Map<string, ConversationState>();

export async function getConversationState(phoneNumber: string): Promise<ConversationState> {
  const existing = conversationStore.get(phoneNumber);
  
  if (existing) {
    return existing;
  }

  const newState: ConversationState = {
    phoneNumber,
    controlMode: 'ai',
    needsReview: false,
    lastMessage: '',
    lastMessageTime: new Date().toISOString(),
    messageCount: 0,
    history: [],
  };

  conversationStore.set(phoneNumber, newState);
  return newState;
}

export async function updateConversationState(
  phoneNumber: string,
  updates: Partial<ConversationState>
): Promise<void> {
  const current = await getConversationState(phoneNumber);
  const updated = { ...current, ...updates };
  conversationStore.set(phoneNumber, updated);
}

export async function setControlMode(
  phoneNumber: string,
  mode: 'ai' | 'manual'
): Promise<void> {
  await updateConversationState(phoneNumber, { controlMode: mode });
  console.log(`Control mode for ${phoneNumber} set to: ${mode}`);
}

export async function getAllActiveConversations(): Promise<ConversationState[]> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const active: ConversationState[] = [];
  
  for (const [_, conversation] of conversationStore) {
    const lastMessageTime = new Date(conversation.lastMessageTime).getTime();
    if (lastMessageTime > oneDayAgo) {
      active.push(conversation);
    }
  }

  return active.sort((a, b) => 
    new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );
}