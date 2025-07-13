// Google Apps Script integration for stationery management system
// This replaces the Google Sheets API with a simpler Apps Script web app approach

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcCOnAk_OF6gXGl-pxY1RlEwuEAUnyE_7sriH3ga8FnYJAv3HlSpu0CNGgxqaJxET5/exec';

// Types for our data
export interface ItemLog {
  id: string;
  namaBarang: string;
  bilangan: number;
  image: string;
  bilLog1: number;
  bilLog2: number;
  bilLog3: number;
  bilLog4: number;
  bilLog5: number;
  bilLog6: number;
  bilLog7: number;
  bilLog8: number;
  bilLog9: number;
  bilLog10: number;
  total: number;
  current: number;
}

export interface LogEntry {
  id: string;
  tarikhDanMasa: string;
  email: string;
  department: string;
  items: Array<{
    namaBarang: string;
    bilangan: number;
  }>;
  status: string;
}

interface RequestItem {
  namaBarang: string;
  bilangan: number;
}

interface Request {
  id: number;
  email: string;
  department: string;
  items: RequestItem[];
  status: 'PENDING' | 'APPROVE' | 'DECLINE' | 'APPLY';
}

// Get all items from ITEMLOG sheet
export async function getItems(): Promise<ItemLog[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getItems');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getItems: Error fetching items:', error);
    throw error;
  }
}

// Get all logs from LOG sheet
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getLogs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getLogs: Error fetching logs:', error);
    throw error;
  }
}

// Get all requests from LOG sheet (for admin page)
export async function getRequests(): Promise<Request[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL + '?action=getRequests');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('getRequests: Error fetching requests:', error);
    throw error;
  }
}

// Add new item to ITEMLOG sheet
export async function addItem(item: Omit<ItemLog, 'id'>): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'addItem',
        namaBarang: item.namaBarang,
        bilangan: item.bilangan,
        image: item.image
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    await response.json();
  } catch (error) {
    console.error('addItem: Error adding item:', error);
    throw error;
  }
}

// Log usage (add to LOG sheet and update ITEMLOG)
export async function logUsage(
  email: string,
  department: string,
  items: RequestItem[]
): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logUsage',
        email,
        department,
        items: JSON.stringify(items.map(item => ({
          ...item,
          bilangan: Number(item.bilangan)
        })))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('logUsage: Error logging usage:', error);
    throw error;
  }
}

export async function updateLogStatus(request: Request): Promise<any> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateLogStatus',
        logId: request.id, // Add logId for compatibility
        id: request.id,
        status: request.status,
        email: request.email,
        department: request.department,
        items: JSON.stringify(request.items.map(item => ({
          ...item,
          bilangan: Number(item.bilangan)
        })))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    console.error('updateLogStatus: Error updating status:', error);
    throw error;
  }
}

export async function restockItem(id: string, addQty: number): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'restockItem',
        id: Number(id), // Convert to number
        addQty: Math.max(0, Number(addQty)) // Ensure positive number
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    
    console.log('Restock result:', result);
  } catch (error) {
    console.error('restockItem: Error restocking item:', error);
    throw error;
  }
}

export async function editItem(id: string, namaBarang: string, image: string): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'editItem',
        id: Number(id), // Convert to number
        namaBarang,
        image
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
    console.error('editItem: Error editing item:', error);
    throw error;
  }
}

// Get image URL from Google Drive (simplified version)
export async function getImageUrl(imagePath: string): Promise<string> {
  try {
    if (!imagePath) return '';
    
    // For Apps Script approach, we'll return the path as-is
    // You can modify this to use Google Drive API if needed
    if (imagePath.includes('drive.google.com')) {
      return imagePath;
    }
    
    // If it's a file ID, convert to viewable URL
    return `/ITEMLOG_Images/${imagePath}`;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
} 