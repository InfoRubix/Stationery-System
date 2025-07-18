import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get expense status requests
    const response = await fetch('https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec?action=getExpenseStatus');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching expense status:', error);
    return NextResponse.json({ error: 'Failed to fetch expense status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = formData.get('action');
    
    // Always forward as FormData
    const scriptFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      scriptFormData.append(key, value);
    }
    
    const response = await fetch('https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec', {
      method: 'POST',
      body: scriptFormData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in expenses API:', error);
    return NextResponse.json({ error: error.message || 'Failed to process expense request' }, { status: 500 });
  }
} 