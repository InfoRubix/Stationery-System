import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec';

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getPriceStock');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const form = await req.formData();
    const appsScriptForm = new FormData();
    for (const [key, value] of form.entries()) {
      appsScriptForm.append(key, value);
    }
    appsScriptForm.append('action', 'editPriceStock');
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: appsScriptForm,
    });
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return NextResponse.json({ message: 'Edited successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
} 