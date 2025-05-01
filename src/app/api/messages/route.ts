import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

type MessageInput = {
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt?: string;
};

export async function POST(request: Request) {
  try {
    const { userId, message } = await request.json() as { 
      userId: string; 
      message: MessageInput;
    };

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required' },
        { status: 400 }
      );
    }

    // Handle database IDs by removing the "db-" prefix if present
    const dbConversationId = message.conversationId.startsWith('db-')
      ? message.conversationId.replace('db-', '')
      : message.conversationId;

    // Verify that the conversation exists and belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: { id: dbConversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: dbConversationId },
      data: { updatedAt: new Date() }
    });

    // Create the new message
    try {
      const newMessage = await prisma.message.create({
        data: {
          conversationId: dbConversationId,
          sender: message.sender,
          text: message.text,
          createdAt: message.createdAt ? new Date(message.createdAt) : new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: {
          id: newMessage.id,
          sender: newMessage.sender,
          text: newMessage.text,
          createdAt: newMessage.createdAt.toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating message:', error);
      return NextResponse.json(
        { error: 'Failed to create message', details: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 