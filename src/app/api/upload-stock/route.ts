import { NextResponse } from "next/server";

// Google Apps Script Web App URL - you'll need to provide this
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const quantity = formData.get('quantity') as string;
    const targetStock = formData.get('targetStock') as string;
    const limit = formData.get('limit') as string;
    const category = formData.get('category') as string;
    const file = formData.get('image') as File;

    // Validate required fields
    if (!name || !quantity || !file) {
      return NextResponse.json({ error: "Name, quantity, and image are required." }, { status: 400 });
    }

    if (typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64 for Google Apps Script
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Get file extension
    const fileName = file.name;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_') + fileExtension;

    // Prepare data for Google Apps Script
    const scriptFormData = new FormData();
    scriptFormData.append('action', 'addStock');
    scriptFormData.append('namaBarang', name);
    scriptFormData.append('bilangan', quantity);
    scriptFormData.append('targetStock', targetStock || '0');
    scriptFormData.append('limit', limit || '0');
    scriptFormData.append('category', category || '');
    scriptFormData.append('imageData', base64);
    scriptFormData.append('fileName', cleanFileName);
    scriptFormData.append('mimeType', file.type);

    // Send to Google Apps Script
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      body: scriptFormData,
    });

    console.log('Google Apps Script response status:', response.status);
    console.log('Google Apps Script response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Apps Script error response:', errorText);
      throw new Error(`Google Apps Script HTTP error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Google Apps Script raw response:', responseText);

    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from Google Apps Script');
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error(`Invalid JSON response from Google Apps Script: ${responseText.substring(0, 200)}`);
    }
    
    if (result.error) {
      throw new Error(result.error);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Stock added successfully!",
      data: result
    });

  } catch (error: any) {
    console.error('Upload stock error:', error);
    return NextResponse.json({ 
      error: error.message || "Failed to add stock" 
    }, { status: 500 });
  }
}