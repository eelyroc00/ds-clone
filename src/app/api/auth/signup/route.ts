import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Create a new user (in a real app, you would hash the password)
    const newUser = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash: password, // In a real app, this would be hashed
      }
    });

    // Generate a mock JWT token
    const token = `mock-jwt-token-${Date.now()}`;

    // Return user data without sensitive information
    return NextResponse.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 