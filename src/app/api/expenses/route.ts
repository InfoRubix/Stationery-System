import { NextRequest, NextResponse } from 'next/server';
import { restockItem, getPriceStock, getItems } from '@/lib/google-apps-script';

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
    const status = formData.get('status');
    const id = formData.get('id');
    
    // If updating to SUCCESS, we need to add stock to ITEMLOG
    if (action === 'updateExpenseStatus' && status === 'SUCCESS' && id) {
      // First get the expense details to know what item and quantity
      const getExpenseResponse = await fetch('https://script.google.com/macros/s/AKfycbwPiDhossG-Zu9YEIp4jUskclb15L5jdtvvD1Ynbdy3Iu2PPjWdmwVnv8gfHDko6k5D/exec?action=getExpenseStatus');
      const expenseData = await getExpenseResponse.json();
      
      // Find the specific expense record
      const expense = expenseData.find((exp: any) => (exp.ID || exp.id) === id);
      
      if (expense) {
        const itemName = expense["ITEM NAME"] || expense.itemName;
        const quantity = parseInt(expense.QUANTITY || expense.quantity || '0');
        const tierQty = expense["TIER QTY"] || expense.tierQty || '';
        
        if (itemName && quantity > 0) {
          // Get PRICESTOCK to find the tier quantity multiplier
          const priceStockData = await getPriceStock();
          const priceStockItem = priceStockData.find((item: any) => item["NAMA BARANG"] === itemName);
          
          let stockToAdd = quantity; // Default: just add the purchased quantity
          
          if (priceStockItem && tierQty) {
            // Parse tier (e.g., "Tier 1" -> 1)
            const tierMatch = tierQty.match(/Tier (\d+)/);
            if (tierMatch) {
              const tierNum = parseInt(tierMatch[1]);
              const tierQtyField = `TIER ${tierNum} QTY`;
              const tierQtyValue = parseInt(priceStockItem[tierQtyField] || '1');
              
              // Calculate total stock to add: Tier Qty * Purchase Qty
              stockToAdd = tierQtyValue * quantity;
            }
          }
          
          try {
            // Find the item ID in ITEMLOG by name
            const itemsData = await getItems();
            const itemLogItem = itemsData.find((item: any) => item["NAMA BARANG"] === itemName);
            
            if (itemLogItem) {
              // Add stock to ITEMLOG using restockItem function with the ITEMLOG item ID
              await restockItem(itemLogItem.ID, stockToAdd);
              console.log(`Added ${stockToAdd} units of ${itemName} to ITEMLOG (Tier: ${tierQty}, Purchased: ${quantity})`);
            } else {
              console.error(`Item ${itemName} not found in ITEMLOG`);
            }
          } catch (restockError) {
            console.error('Error adding stock to ITEMLOG:', restockError);
            // Continue with status update even if restock fails
          }
        }
      }
    }
    
    // Always forward the original request to Google Apps Script
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