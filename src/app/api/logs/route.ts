import { NextRequest, NextResponse } from 'next/server';
import { getLogs, logUsage } from '@/lib/google-apps-script';

export async function GET() {
  try {
    const logs = await getLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, department, items } = body;

    if (!email || !department || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Email, department, and items array are required' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.namaBarang || !item.bilangan) {
        return NextResponse.json(
          { error: 'Each item must have namaBarang and bilangan' },
          { status: 400 }
        );
      }
    }

    await logUsage(email, department, items);

    return NextResponse.json({ message: 'Usage logged successfully' });
  } catch (error) {
    console.error('Error logging usage:', error);
    return NextResponse.json(
      { error: 'Failed to log usage' },
      { status: 500 }
    );
  }
} 