import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Replace with your actual Apps Script URL
    const response = await fetch('https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec?action=getExpenseLog');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching expense log:', error);
    return NextResponse.json({ error: 'Failed to fetch expense log' }, { status: 500 });
  }
}