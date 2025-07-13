// Google Drive integration for image uploads
// This replaces local file storage with Google Drive storage

const GOOGLE_DRIVE_API_URL = 'https://script.google.com/macros/s/AKfycbzcCOnAk_OF6gXGl-pxY1RlEwuEAUnyE_7sriH3ga8FnYJAv3HlSpu0CNGgxqaJxET5/exec';

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

// Upload image to Google Drive
export async function uploadImageToDrive(
  file: File,
  fileName: string
): Promise<DriveFile> {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const response = await fetch(GOOGLE_DRIVE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'uploadImage',
        fileName: fileName,
        fileData: base64,
        mimeType: file.type
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }

    return {
      id: result.id,
      name: result.name,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink
    };
  } catch (error) {
    console.error('uploadImageToDrive: Error uploading image:', error);
    throw error;
  }
}

// Get image URL from Google Drive
export function getImageUrl(driveFile: DriveFile): string {
  // Use webContentLink for direct access to the image
  return driveFile.webContentLink;
}

// Delete image from Google Drive
export async function deleteImageFromDrive(fileId: string): Promise<void> {
  try {
    const response = await fetch(GOOGLE_DRIVE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteImage',
        fileId: fileId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('deleteImageFromDrive: Error deleting image:', error);
    throw error;
  }
} 