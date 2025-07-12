import { NextResponse } from "next/server";
import { addItem } from "@/lib/google-apps-script";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const quantity = formData.get('quantity') as string;
    const file = formData.get('image') as File;

    if (!file || typeof file === 'string') {
      throw new Error('No file uploaded');
    }

    // Save to local
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name.replace(/\s+/g, "_");
    const localPath = path.join(process.cwd(), "public", "ITEMLOG_Images", filename);
    fs.writeFileSync(localPath, buffer);

    // Add to Google Sheet with all required fields
    const qty = Number(quantity);
    await addItem({
      namaBarang: name,
      bilangan: qty,
      image: `ITEMLOG_Images/${filename}`,
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}