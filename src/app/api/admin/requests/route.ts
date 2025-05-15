import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/requests - List all requests
export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // TODO: Implement request listing logic
    const requests = [
      {
        id: '1',
        title: 'Sample Request',
        status: 'pending',
        createdAt: new Date().toISOString(),
        caseworker: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    ];

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error listing requests:', error);
    return NextResponse.json(
      { error: 'Failed to list requests' },
      { status: 500 }
    );
  }
} 