import { NextRequest, NextResponse } from 'next/server';
import { getItems, addItem } from '@/lib/google-apps-script';
import { restockItem, editItem } from '@/lib/google-apps-script';

// In-memory cache
let cache: { data: any, timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET(req: NextRequest) {
  // Pagination and search params
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = (searchParams.get('search') || '').toLowerCase();
  const inStock = searchParams.get('inStock') === 'true';
  const outOfStock = searchParams.get('outOfStock') === 'true';

  // Use cache if not expired
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    let items = cache.data;
    if (search) {
      items = items.filter((item: any) =>
        (item["NAMA BARANG"] || '').toLowerCase().includes(search)
      );
    }
    if (inStock) {
      items = items.filter((item: any) => Number(item["CURRENT"]) > 0);
    } else if (outOfStock) {
      items = items.filter((item: any) => Number(item["CURRENT"]) === 0);
    }
    const paginated = paginate(items, page, limit);
    return NextResponse.json(paginated);
  }
  
  try {
    const data = await getItems();
    cache = { data, timestamp: Date.now() }; // Update cache
    let items = data;
    if (search) {
      items = items.filter((item: any) =>
        (item["NAMA BARANG"] || '').toLowerCase().includes(search)
      );
    }
    if (inStock) {
      items = items.filter((item: any) => Number(item["CURRENT"]) > 0);
    } else if (outOfStock) {
      items = items.filter((item: any) => Number(item["CURRENT"]) === 0);
    }
    const paginated = paginate(items, page, limit);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

function paginate(data: any[], page: number, limit: number) {
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: data.slice(start, end),
    page,
    limit,
    total,
    totalPages
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await addItem(body);
    return NextResponse.json({ message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
} 

export async function PUT(req: Request) {
  try {
    // Use formData for FormData requests
    const form = await req.formData();
    const body = Object.fromEntries(form.entries());

    if (body.action === 'restock' || body.action === 'restockItem') {
      if (!body.id || typeof body.addQty === 'undefined') {
        return NextResponse.json({ error: 'Missing id or addQty' }, { status: 400 });
      }
      await restockItem(String(body.id), Number(body.addQty));
      return NextResponse.json({ message: 'Restocked successfully' });
    } else if (body.action === 'edit' || body.action === 'editItem') {
      if (!body.id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
      }
      // Pass individual parameters to editItem
      await editItem(
        String(body.id),
        String(body.namaBarang || ''),
        String(body.image || ''),
        String(body.current || ''),
        String(body.targetStock || ''),
        String(body.limit || ''),
        String(body.oldName || '')
      );
      return NextResponse.json({ message: 'Edited successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in PUT /api/items:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
} 