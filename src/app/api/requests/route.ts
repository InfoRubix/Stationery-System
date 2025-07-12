import { NextRequest, NextResponse } from 'next/server';
import { logUsage, updateLogStatus, getRequests } from '../../../lib/google-apps-script';

type RequestStatus = 'PENDING' | 'APPROVE' | 'DECLINE' | 'APPLY';

interface RequestItem {
  namaBarang: string;
  bilangan: number;
}

interface StationeryRequest {
  id: number;
  email: string;
  department: string;
  items: RequestItem[];
  status: RequestStatus;
  logId?: number | null;
}

export async function GET() {
  try {
    const requests = await getRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.email || !body.department || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: email, department, and items are required' },
        { status: 400 }
      );
    }

    // Validate items format
    for (const item of body.items) {
      if (!item.namaBarang || typeof item.bilangan !== 'number' || item.bilangan <= 0) {
        return NextResponse.json(
          { error: 'Invalid item format. Each item must have namaBarang (string) and bilangan (positive number)' },
          { status: 400 }
        );
      }
    }

    // Call Apps Script to log usage and create request
    try {
      const logResult = await logUsage(
        body.email,
        body.department,
        body.items
      );
      
      // Create request object from the log result
      const newRequest: StationeryRequest = {
        id: logResult.logId || Date.now(), // Use logId from Google Sheet or timestamp as fallback
        email: body.email,
        department: body.department,
        items: body.items,
        status: 'PENDING',
        logId: logResult.logId
      };

      return NextResponse.json(newRequest);
    } catch (gsError) {
      console.error('Failed to log usage in Google Sheet:', gsError);
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to create request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, email, department, items } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!['PENDING', 'APPROVE', 'DECLINE', 'APPLY'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be one of: PENDING, APPROVE, DECLINE, APPLY' },
        { status: 400 }
      );
    }

    // Call Apps Script to update status in Google Sheet
    try {
      await updateLogStatus({
        id: Number(id), // Use the log ID from Google Sheet
        status: status as RequestStatus,
        email,
        department,
        items
      });

      // Return the updated request
      const updatedRequest: StationeryRequest = {
        id: Number(id),
        email,
        department,
        items,
        status: status as RequestStatus,
        logId: Number(id)
      };

      return NextResponse.json(updatedRequest);
    } catch (gsError) {
      console.error('Failed to update status in Google Sheet:', gsError);
      return NextResponse.json(
        { error: 'Failed to update request status. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to update request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
} 