import { NextResponse } from "next/server";
import { addItem } from "@/lib/google-apps-script";
import { uploadImageToDrive } from "@/lib/google-drive";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const quantity = formData.get('quantity') as string;
    const file = formData.get('image') as File;

    if (!file || typeof file === 'string') {
      throw new Error('No file uploaded');
    }

    // Upload to Google Drive instead of local storage
    const filename = file.name.replace(/\s+/g, "_");
    const driveFile = await uploadImageToDrive(file, filename);

    // Add to Google Sheet with Google Drive image URL
    const qty = Number(quantity);
    await addItem({
      namaBarang: name,
      bilangan: qty,
      image: driveFile.webContentLink, // Use Google Drive URL instead of local path
      bilLog1: qty,
      bilLog2: 0,
      bilLog3: 0,
      bilLog4: 0,
      bilLog5: 0,
      bilLog6: 0,
      bilLog7: 0,
      bilLog8: 0,
      bilLog9: 0,
      bilLog10: 0,
      total: qty,
      current: qty,
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: driveFile.webContentLink,
      driveFileId: driveFile.id 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}