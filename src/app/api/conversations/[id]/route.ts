import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log(`DELETE request received for conversation ID: ${id}`);
    
    // Extract the actual DB ID by removing the 'db-' prefix if it exists
    const conversationId = id.startsWith('db-') ? id.replace('db-', '') : id;
        
    try {
      // First check if the conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation) {
        console.error(`Conversation not found with ID: ${conversationId}`);
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      
      // TODO - Invalidate conversation cache 
            
      // Delete the messages first to avoid foreign key constraints
      const deletedMessages = await prisma.message.deleteMany({
        where: { conversationId: conversationId }
      });
      
      // Then delete the conversation
      const deletedConversation = await prisma.conversation.delete({
        where: { id: conversationId }
      });
      
      console.log(`Successfully deleted conversation: ${JSON.stringify(deletedConversation)}`);
            
      return NextResponse.json({ 
        success: true,
        message: `Conversation ${conversationId} and its messages were successfully deleted`
      });
    } catch (deleteError) {
      console.error(`Error during deletion: ${deleteError}`);
      return NextResponse.json(
        { error: `Failed to delete: ${deleteError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in delete conversation endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: String(error) },
      { status: 500 }
    );
  }
} 