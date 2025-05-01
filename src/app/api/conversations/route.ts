import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Define types
type ConversationInput = {
  id?: string;
  title: string;
};

export async function GET(request: Request) {
  try {
    // In a real app, get user ID from an auth token
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching conversations for user: ${userId}`);

    // Get all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`Found ${conversations.length} conversations for user ${userId}`);

    // Format conversations for client (add db- prefix to IDs and transform the date fields)
    const formattedConversations = conversations.map(conv => ({
      id: `db-${conv.id}`,
      title: conv.title,
      lastUpdated: conv.updatedAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      messages: conv.messages.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        createdAt: msg.createdAt.toISOString()
      }))
    }));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, conversation } = await request.json() as { 
      userId: string; 
      conversation: ConversationInput 
    };

    if (!userId || !conversation) {
      return NextResponse.json(
        { error: 'User ID and conversation are required' },
        { status: 400 }
      );
    }

    console.log(`Creating conversation: ${conversation.title}, User: ${userId}`);

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        userId,
        title: conversation.title,
        updatedAt: new Date()
      }
    });

    console.log(`Successfully created new conversation: ${newConversation.id}`);
    
    return NextResponse.json({
      conversation: {
        ...newConversation,
        id: `db-${newConversation.id}`,
        lastUpdated: newConversation.updatedAt.toISOString(),
        createdAt: newConversation.createdAt.toISOString(),
        messages: []
      }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: String(error) },
      { status: 500 }
    );
  }
} 