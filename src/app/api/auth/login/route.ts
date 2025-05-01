import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Find user in the database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.passwordHash !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate a mock JWT token (in a real app, use a proper JWT library)
    const token = `mock-jwt-token-${Date.now()}`;

    // Return user data without sensitive information
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 