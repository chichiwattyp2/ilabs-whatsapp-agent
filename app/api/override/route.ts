import { NextRequest, NextResponse } from 'next/server';
import { setControlMode } from '@/lib/conversationStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, action } = body;

    if (!phoneNumber || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'takeover') {
      await setControlMode(phoneNumber, 'manual');
      
      return NextResponse.json({
        success: true,
        message: 'Control taken over successfully',
        mode: 'manual',
      });
    } else if (action === 'resume') {
      await setControlMode(phoneNumber, 'ai');
      
      return NextResponse.json({
        success: true,
        message: 'AI resumed successfully',
        mode: 'ai',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}