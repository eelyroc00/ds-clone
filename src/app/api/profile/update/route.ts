import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, displayName } = await request.json();
    
    // In a real app, we'd verify the user's identity with JWT
    // For simplicity, we'll use the email as the identifier
    
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: { 
        displayName,
        // Note: we're not allowing email changes in this implementation
        // In a real app, you'd want to verify the new email
      }
    });
    
    // Return updated user info without sensitive data
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An error occurred during profile update' },
      { status: 500 }
    );
  }
} 