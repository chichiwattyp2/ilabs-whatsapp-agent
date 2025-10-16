
import { NextResponse } from 'next/server';
import { getAllActiveConversations } from '@/lib/conversationStore';

export async function GET() {
  try {
    const conversations = await getAllActiveConversations();
    
    return NextResponse.json({
      success: true,
      conversations: conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}