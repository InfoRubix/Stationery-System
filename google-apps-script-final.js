// Simplified Google Apps Script backend to support LIMIT field validation
// Copy this code to your Google Apps Script project
// PDF generation now happens on the frontend

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  let allParams = {};
  let action = '';

  if (e.parameter) {
    allParams = e.parameter;
    action = allParams.action;
  }

  console.log('Received action:', action, 'with params:', allParams);

  let result;
  switch(action) {
    case 'getItems':
      result = getItems();
      break;
    case 'getLogs':
      result = getLogs();
      break;
    case 'getRequests':
      result = getRequests();
      break;
    case 'addStock':
      result = addStock(allParams);
      break;
    case 'deleteItem':
      result = deleteItem(allParams);
      break;
    case 'addItem':
      result = addItem(allParams);
      break;
    case 'restockItem':
      result = restockItem(allParams);
      break;
    case 'editItem':
      result = editItem(allParams);
      break;
    case 'logUsage':
      result = logUsage(allParams);
      break;
    case 'updateLogStatus':
      result = updateLogStatus(allParams);
      break;
    case 'uploadImage':
      result = uploadImageToDrive(allParams);
      break;
    case 'deleteImage':
      result = deleteImageFromDrive(allParams);
      break;
    case 'listImageFiles':
      result = listImageFiles();
      break;
    case 'getPriceStock':
      result = getPriceStock();
      break;
    case 'editPriceStock':
      result = editPriceStock (allParams);
      break;
    case 'getExpenseStatus':
      result = getExpenseStatus();
      break;
    case 'addExpenseRequest':
      result = addExpenseRequest(allParams);
      break;
    case 'updateExpenseStatus':
      result = updateExpenseStatus(allParams);
      break;
    case 'getExpenseLog':
      result = getExpenseLog();
      break;
    case 'test':
      result = { message: 'Apps Script is working!', timestamp: new Date().toISOString() };
      break;
    default:
      result = { error: 'Unknown or missing action' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Format date to Malaysian format: DD/MM/YYYY HH:MM:SS
function formatMalaysianDateTime(date) {
  // Use Google Apps Script's Utilities.formatDate to force Malaysia time
  return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');
}

function getItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  if (!sheet) {
    throw new Error('ITEMLOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row
  
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  });
}

function getLogs() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!sheet) {
    throw new Error('LOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row

  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }

    // Build items array from NAMA BARANG*X and BILANGAN*X
    const items = [];
    for (let i = 1; i <= 10; i++) {
      const nama = obj[`NAMA BARANG*${i}`] || obj[`NAMA BARANG *${i}`];
      const bil = obj[`BILANGAN*${i}`];
      if (nama && bil) {
        items.push({ namaBarang: nama, bilangan: bil });
      }
    }
    obj.items = items;

    // Add PDF_LINK alias for compatibility
    obj['PDF_LINK'] = obj['[Document Studio] File Link #Iso9pkez'] || obj['[Document Studio] File Link'] || '';

    // Map to expected frontend fields
    return {
      id: obj['ID'],
      tarikhDanMasa: obj['TARIKH DAN MASA'],
      email: obj['EMAIL'],
      department: obj['DEPARTMENT'],
      items: obj.items,
      status: obj['STATUS'],
      // PDF_LINK: obj['PDF_LINK'],
    };
  });
}

// NEW FUNCTION: Get requests for admin page (formatted for frontend)
function getRequests() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!sheet) {
    throw new Error('LOG sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row

  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }

    // Build items array from NAMA BARANG*X and BILANGAN*X
    const items = [];
    for (let i = 1; i <= 10; i++) {
      const nama = obj[`NAMA BARANG*${i}`] || obj[`NAMA BARANG *${i}`];
      const bil = obj[`BILANGAN*${i}`];
      if (nama && (bil !== null && bil !== undefined && bil !== '')) {
        items.push({ 
          namaBarang: nama, 
          bilangan: parseInt(bil) || 0 
        });
      }
    }

    // Return format expected by admin page
    return {
      id: parseInt(obj['ID']) || 0,
      email: obj['EMAIL'] || '',
      department: obj['DEPARTMENT'] || '',
      items: items,
      status: obj['STATUS'] || 'PENDING',
      logId: parseInt(obj['ID']) || 0
    };
  });
}

function addStock(params) {
  try {
    console.log('addStock called with params:', params);

    // Your Google Sheets ID and Drive folder ID
    const SHEET_ID = '1YvlASAjGQrtkmjG5Luj3fZNXkUro_Q0W2z6iqlajAt0';
    const FOLDER_ID = '1xRI9_q6hNK5IJhzziuhyy92Fj-jDaoNy';

    // Get parameters
    const namaBarang = params.namaBarang;
    const bilangan = parseInt(params.bilangan);
    const targetStock = parseInt(params.targetStock) || 0;
    const limit = parseInt(params.limit) || 0;
    const category = params.category || '';
    const imageData = params.imageData;
    const fileName = params.fileName;
    const mimeType = params.mimeType;
    console.log('Extracted values:',
    {
      namaBarang, bilangan, targetStock, limit, category, fileName, mimeType,
      imageDataLength: imageData ? imageData.length : 'null'
    });

    // Validate required fields
    if (!namaBarang) {
      throw new Error('namaBarang is required');
    }
    if (!bilangan || isNaN(bilangan))     
  {
      throw new Error('bilangan is required and must be a number, got: ' + params.bilangan);
    }
    if (!imageData) {
      throw new Error('imageData is required');
    }
    if (!fileName) {
      throw new Error('fileName is required');
    }

    console.log('Validation passed, uploading image...');

    // Upload image to Google Drive       
    const folder = DriveApp.getFolderById(FOLDER_ID);        
    console.log('Got folder:',folder.getName());

    const blob = Utilities.newBlob(Utilities.base64Decode(imageData),mimeType, fileName);
    console.log('Created blob with size:', blob.getBytes().length);

    const file = folder.createFile(blob);
    console.log('File created with ID:', file.getId());

    // Make file publicly viewable        
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);

    // Get image URL
    const imageUrl = `https://drive.google.com/uc?id=${file.getId()}`;
    console.log('Image URL:',imageUrl);

    console.log('Opening spreadsheet...');

    // Open spreadsheet and get ITEMLOG sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);        
    const sheet = spreadsheet.getSheetByName('ITEMLOG');

    if (!sheet) {
      throw new Error('ITEMLOG sheet not found in spreadsheet');
    }

    console.log('Found ITEMLOG sheet with', sheet.getLastRow(), 'rows');       

    // Generate unique ID
    const id = new Date().getTime().toString();

    // Add row to sheet
    const newRow = [
      id,                    // ID        
      namaBarang,           // NAMABARANG
      bilangan,             //BILANGAN
      imageUrl,             // IMAGE      
      bilangan,             // BIL LOG*1
      0,                    // BIL LOG*2
      0,                    // BIL LOG*3
      0,                    // BIL LOG*4
      0,                    // BIL LOG*5
      0,                    // BIL LOG*6
      0,                    // BIL LOG*7
      0,                    // BIL LOG*8
      0,                    // BIL LOG*9
      0,                    // BIL LOG*10
      bilangan,             // TOTAL      
      bilangan,             // CURRENT
      targetStock,          // TARGETSTOCK
      category,             // CATEGORY
      limit                 // LIMIT      
    ];

    console.log('Adding row:',newRow);

    sheet.appendRow(newRow);

  // Add this after the ITEMLOG insertion (after sheet.appendRow(newRow);)

  console.log('Adding to PRICESTOCK sheet...');

  // Also add to PRICESTOCK sheet with basic info
  const priceStockSheet = spreadsheet.getSheetByName('PRICESTOCK');     
  if (priceStockSheet) {
    const priceStockRow = [
      id,           // ID (same as ITEMLOG)     
      namaBarang,   // NAMA BARANG
      '', '', '', '', '', '', '', '', '', '', ''  // Empty columns for prices(admin will fill later)
    ];


  priceStockSheet.appendRow(priceStockRow);     
    console.log('Added to PRICESTOCK sheet successfully');
  } else {
    console.log('PRICESTOCK sheet not found, skipping...');
  }
    console.log('Row added successfully. New last row:',sheet.getLastRow());

    return {
      success: true,
      id: id,
      imageUrl: imageUrl,
      driveFileId: file.getId(),
      message: 'Stock added successfully to ITEMLOG sheet'
    };

  } catch (error) {
    console.error('addStock error:',error);

    return {
      success: false,
      error: 'addStock error: ' + error.toString()
    };
  }
}

function deleteItem(params) {
  try {
    console.log('deleteItem called with params:', params);

    // Your Google Sheets ID
    const SHEET_ID = '1YvlASAjGQrtkmjG5Luj3fZNXkUro_Q0W2z6iqlajAt0';

    // Get ID from params (FormData sends it as 'id')
    const id = params.id;

    if (!id) {
      console.error('No ID provided.Params received:', params);
      throw new Error('Item ID is required');
    }

    console.log('Attempting to delete item with ID:', id, 'Type:', typeof id);

    // Open spreadsheet and get ITEMLOG sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);        
    const sheet = spreadsheet.getSheetByName('ITEMLOG');

    if (!sheet) {
      throw new Error('ITEMLOG sheet not found in spreadsheet');
    }

    // Get all data
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      throw new Error('No data found in sheet');
    }

    const headers = data[0];
    console.log('Headers found:',headers);

    // Find ID column
    const idColumnIndex = headers.findIndex(header =>
      header === 'ID' || header.toString().toUpperCase() === 'ID'
    );

    if (idColumnIndex === -1) {
      throw new Error('ID column not found. Available columns: ' + headers.join(', '));
    }

    console.log('ID column index:',idColumnIndex);

    // Find the row to delete
    let rowToDelete = -1;
    for (let i = 1; i < data.length; i++) {
      const cellValue = data[i][idColumnIndex];
      if (String(cellValue) === String(id)) {
        rowToDelete = i + 1; // Sheet rows are 1-indexed
        console.log('Found item at row:', rowToDelete, 'Cell value:', cellValue);
        break;
      }
    }

    if (rowToDelete === -1) {
      // Debug: show first few IDs
      const firstFewIds = [];
      for (let i = 1; i < Math.min(6,data.length); i++) {
        firstFewIds.push(String(data[i][idColumnIndex]));
      }
      throw new Error(`Item not found with ID: "${id}". First few IDs in sheet: [${firstFewIds.join(', ')}]`);
    }

    // Delete the row
    sheet.deleteRow(rowToDelete);
    console.log('Successfully deleted row:', rowToDelete);

    return {
      success: true,
      message: 'Item deleted successfully'
    };

  } catch (error) {
    console.error('deleteItem error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

function addItem(params) {
    const sheet =SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    if (!sheet) {
      throw new Error('ITEMLOG sheet not found');
    }
    const namaBarang = params.namaBarang;
    const bilangan = parseInt(params.bilangan) || 0;
    const image = params.image || '';     
    const targetStock = parseInt(params.targetStock) || 0;      
    const category = params.category || '';
    const limit = parseInt(params.limit) || 0;

    if (!namaBarang || bilangan <= 0)     
   {
      throw new Error('Item name and quantity are required');
    }

    // Get next ID
    const lastRow = sheet.getLastRow();
    const id = lastRow; // or lastRow + 1 if you want to skip header row     

    // Prepare row data - make sure this matches your sheet column order
    const newRow = [
      id,                    // ID (column 1)
      namaBarang,           // NAMA BARANG (column 2)
      bilangan.toString(),  // BILANGAN (column 3)
      image,                // IMAGE (column 4)
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', // bilLog1-10 (column 5-14)      
      '0',                  // total (column 15)
      bilangan.toString(),  // current (column 16)
      targetStock.toString(), // TARGETSTOCK (column 17) 
      category.              // CATEGORY (column 18) 
      limit.toString()     // LIMIT (column 19)     
    ];

    // Add to sheet
    sheet.appendRow(newRow);

    return { success: true, id: id };     
  }

function restockItem(params) {
  try {
    const id = Number(params.id);
    const addQty = Math.max(0, Number(params.addQty) || 0);
    
    console.log('Restock request:', { id, addQty });
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    if (!sheet) {
      throw new Error('ITEMLOG sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find the current column index
    const currentColIndex = headers.findIndex(header => header === 'CURRENT');
    if (currentColIndex === -1) {
      throw new Error('CURRENT column not found');
    }
    
    // Find the row with matching ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (Number(data[i][0]) === id) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error(`Item with ID ${id} not found`);
    }
    
    // Get current value and calculate new value
    const currentValue = Number(data[rowIndex][currentColIndex]) || 0;
    const newValue = currentValue + addQty;
    
    // Update the cell
    const range = sheet.getRange(rowIndex + 1, currentColIndex + 1);
    range.setValue(newValue);
    
    // Verify the update
    const updatedValue = range.getValue();
    if (Number(updatedValue) !== newValue) {
      throw new Error('Failed to update value');
    }
    
    console.log('Restock successful:', {
      id,
      oldValue: currentValue,
      addQty,
      newValue: updatedValue
    });
    
    return {
      success: true,
      id,
      oldStock: currentValue,
      addQty,
      newStock: updatedValue
    };
    
  } catch (error) {
    console.error('Restock error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function editItem(params) {
  const id = params.id;
  const newName = params.namaBarang;
  const newImage = params.image;
  const newCurrent = params.current;
  const newTargetStock = params.targetStock;
  const newLimit = params.limit;

  // Update ITEMLOG
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  if (!sheet) throw new Error('ITEMLOG sheet not found');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      if (newName !== undefined) sheet.getRange(i+1, 2).setValue(newName);
      if (newImage !== undefined) sheet.getRange(i+1, 4).setValue(newImage);
      if (newCurrent !== undefined) sheet.getRange(i+1, 16).setValue(newCurrent);
      if (newTargetStock !== undefined) sheet.getRange(i+1, 17).setValue(newTargetStock);
      if (newLimit !== undefined) sheet.getRange(i+1, 19).setValue(newLimit);
      break;
    }
  }

  // Update PRICESTOCK by ID
  const priceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRICESTOCK');
  if (priceSheet) {
    const priceData = priceSheet.getDataRange().getValues();
    for (let j = 1; j < priceData.length; j++) {
      if (String(priceData[j][0]) === String(id)) { // ID is in column 1 (A)
        if (newName !== undefined) priceSheet.getRange(j+1, 2).setValue(newName); // column 2 is NAMA BARANG
        break;
      }
    }
  }

  return { success: true };
}

function logUsage(params) {
  console.log('Starting logUsage with params:', JSON.stringify(params));
  
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  const itemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  
  console.log('Sheets found:', {
    logSheet: !!logSheet,
    itemSheet: !!itemSheet
  });
  
  if (!logSheet || !itemSheet) throw new Error('Required sheets not found');

  const email = params.email;
  const department = params.department;
  let items = [];
  
  console.log('Processing items parameter:', typeof params.items, params.items);
  
  if (Array.isArray(params.items)) {
    items = params.items;
  } else if (typeof params.items === 'string') {
    try { 
      items = JSON.parse(params.items);
      console.log('Parsed items from string:', items);
    } catch (err) {
      console.error('Failed to parse items:', err);
      throw new Error('Invalid items JSON');
    }
  }
  
  if (!email || !department || !items || items.length === 0) {
    console.error('Validation failed:', { email, department, itemsLength: items?.length });
    throw new Error('Email, department, and items are required');
  }

  // Get next log ID
  const lastLogRow = logSheet.getLastRow();
  const logId = lastLogRow;
  
  console.log('Generated logId:', logId);

  // Format date in Malaysian format
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');

  // Prepare log entry
  const logRow = [logId, timestamp, email, department];
  for (let i = 0; i < 10; i++) {
    if (i < items.length) {
      logRow.push(items[i].namaBarang, items[i].bilangan.toString());
    } else {
      logRow.push('', '0');
    }
  }
  logRow.push('PENDING'); // status
  logRow.push(''); // [Document Studio] File Status
  logRow.push(''); // [Document Studio] File Link

  console.log('Prepared log row:', logRow);

  try {
    // Add to LOG sheet
    logSheet.appendRow(logRow);
    console.log('Successfully added log row');

    // Deduct stock for each item
    console.log('Starting stock deduction...');
    const itemData = itemSheet.getDataRange().getValues();
    
    for (let j = 0; j < items.length; j++) {
      const itemName = items[j].namaBarang;
      const qty = parseInt(items[j].bilangan);
      console.log('Processing item:', { itemName, qty });
      
      let found = false;
      for (let k = 1; k < itemData.length; k++) {
        if (itemData[k][1] == itemName) {
          found = true;
          const current = parseInt(itemData[k][15]) || 0; // CURRENT is in column 16 (index 15)
          const newCurrent = Math.max(0, current - qty);
          console.log('Updating stock:', { 
            item: itemName, 
            row: k+1, 
            oldStock: current, 
            deduction: qty, 
            newStock: newCurrent 
          });
          itemSheet.getRange(k+1, 16).setValue(newCurrent);
          break;
        }
      }
      if (!found) {
        console.warn(`Item not found in ITEMLOG: ${itemName}`);
      }
    }
    console.log('Stock deduction completed');

    return { success: true, logId: logId };
  } catch (error) {
    console.error('Error in logUsage:', error);
    throw error;
  }
}

function updateLogStatus(params) {
  console.log('Starting updateLogStatus with params:', JSON.stringify(params));
  
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  if (!logSheet) throw new Error('LOG sheet not found');

  // Accept both logId and id
  const logId = params.logId || params.id;
  const newStatus = params.status;
  let items = [];
  let originalItems = [];
  let stockRestoration = [];
  
  console.log('Processing request:', { logId, newStatus });
  
  if (Array.isArray(params.items)) {
    items = params.items;
  } else if (typeof params.items === 'string') {
    try { 
      items = JSON.parse(params.items);
      console.log('Parsed items from string:', items);
    } catch (err) {
      console.warn('Failed to parse items:', err);
    }
  }

  // Parse original items if provided
  if (Array.isArray(params.originalItems)) {
    originalItems = params.originalItems;
  } else if (typeof params.originalItems === 'string') {
    try {
      originalItems = JSON.parse(params.originalItems);
      console.log('Parsed originalItems from string:', originalItems);
    } catch (err) {
      console.warn('Failed to parse originalItems:', err);
    }
  }

  // Parse stock restoration items if provided
  if (Array.isArray(params.stockRestoration)) {
    stockRestoration = params.stockRestoration;
  } else if (typeof params.stockRestoration === 'string') {
    try {
      stockRestoration = JSON.parse(params.stockRestoration);
      console.log('Parsed stockRestoration from string:', stockRestoration);
    } catch (err) {
      console.warn('Failed to parse stockRestoration:', err);
    }
  }

  if (!logId || !newStatus) {
    console.error('Missing required fields:', { logId, newStatus });
    throw new Error('Log ID and status are required');
  }

  // Validate status
  const validStatuses = ['PENDING', 'APPROVE', 'DECLINE', 'APPLY'];
  if (!validStatuses.includes(newStatus)) {
    console.error('Invalid status:', newStatus);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Find the log entry
  const data = logSheet.getDataRange().getValues();
  let logRowIndex = -1;

  console.log('Searching for log entry with ID:', logId);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(logId)) {
      logRowIndex = i + 1;
      console.log('Found log entry at row:', logRowIndex);
      break;
    }
  }

  if (logRowIndex === -1) {
    console.error('Log entry not found for ID:', logId);
    throw new Error('Log entry not found');
  }

  try {
    // Update the status (Column Y - index 24)
    console.log('Updating status to:', newStatus, 'at row:', logRowIndex);
    logSheet.getRange(logRowIndex, 25).setValue(newStatus);

    // Update items in LOG sheet if items are provided (for editing)
    if (items && items.length > 0) {
      console.log('Updating items in LOG sheet');
      
      // Clear existing items (columns E to X - indices 4 to 23)
      for (let col = 5; col <= 24; col++) {
        logSheet.getRange(logRowIndex, col).setValue('');
      }
      
      // Set new items (up to 10 items) - including those with quantity 0 for reference
      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const itemName = items[i].namaBarang;
        const qty = parseInt(items[i].bilangan);
        
        const nameCol = 5 + (i * 2); // E, G, I, K, M, O, Q, S, U, W (5, 7, 9, 11, 13, 15, 17, 19, 21, 23)
        const qtyCol = nameCol + 1;   // F, H, J, L, N, P, R, T, V, X (6, 8, 10, 12, 14, 16, 18, 20, 22, 24)
        
        console.log('Setting item:', { 
          index: i, 
          name: itemName, 
          qty: qty, 
          nameCol: nameCol, 
          qtyCol: qtyCol 
        });
        
        logSheet.getRange(logRowIndex, nameCol).setValue(itemName);
        logSheet.getRange(logRowIndex, qtyCol).setValue(qty);
      }
    }

    // Handle stock restoration for DECLINE
    if (newStatus === 'DECLINE' && items.length > 0) {
      console.log('Processing stock restoration for declined request');
      const itemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
      if (itemSheet) {
        const itemData = itemSheet.getDataRange().getValues();
        for (let j = 0; j < items.length; j++) {
          const itemName = items[j].namaBarang;
          const qty = parseInt(items[j].bilangan);
          console.log('Restoring stock for:', { itemName, qty });
          
          let found = false;
          for (let k = 1; k < itemData.length; k++) {
            if (itemData[k][1] == itemName) {
              found = true;
              const current = parseInt(itemData[k][15]) || 0;
              const newCurrent = current + qty;
              console.log('Updating stock:', {
                item: itemName,
                row: k+1,
                oldStock: current,
                addition: qty,
                newStock: newCurrent
              });
              itemSheet.getRange(k+1, 16).setValue(newCurrent);
              break;
            }
          }
          if (!found) {
            console.warn(`Item not found in ITEMLOG: ${itemName}`);
          }
        }
      }
    }

    // Handle stock restoration for request edits
    if (stockRestoration && stockRestoration.length > 0) {
      console.log('Processing stock restoration for edited request');
      const itemSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
      if (itemSheet) {
        const itemData = itemSheet.getDataRange().getValues();
        for (let j = 0; j < stockRestoration.length; j++) {
          const itemName = stockRestoration[j].namaBarang;
          const qty = parseInt(stockRestoration[j].bilangan);
          console.log('Restoring stock for edited item:', { itemName, qty });
          
          let found = false;
          for (let k = 1; k < itemData.length; k++) {
            if (itemData[k][1] == itemName) {
              found = true;
              const current = parseInt(itemData[k][15]) || 0;
              const newCurrent = current + qty;
              console.log('Updating stock for edit:', {
                item: itemName,
                row: k+1,
                oldStock: current,
                addition: qty,
                newStock: newCurrent
              });
              itemSheet.getRange(k+1, 16).setValue(newCurrent);
              break;
            }
          }
          if (!found) {
            console.warn(`Item not found in ITEMLOG: ${itemName}`);
          }
        }
      }
    }

    return { 
      success: true, 
      message: 'Status updated successfully', 
      logId: logId, 
      status: newStatus 
    };
  } catch (error) {
    console.error('Error in updateLogStatus:', error);
    throw error;
  }
}

// NEW FUNCTIONS: Google Drive Image Operations

function uploadImageToDrive(data) {
  try {
    console.log('Starting image upload to Google Drive');
    
    // Decode base64 data
    const fileData = Utilities.base64Decode(data.fileData);
    const blob = Utilities.newBlob(fileData, data.mimeType, data.fileName);
    
    // Get or create the ITEMLOG_Images folder
    let folder;
    try {
      folder = DriveApp.getFoldersByName('ITEMLOG_Images').next();
    } catch (error) {
      // Create folder if it doesn't exist
      folder = DriveApp.createFolder('ITEMLOG_Images');
      console.log('Created new folder: ITEMLOG_Images');
    }
    
    // Create file in the folder
    const file = folder.createFile(blob);
    
    // Set file permissions to anyone with the link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log('Image uploaded successfully:', file.getName());
    
    return {
      success: true,
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      webContentLink: `https://drive.google.com/uc?export=view&id=${file.getId()}`
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: error.toString() };
  }
}

function deleteImageFromDrive(data) {
  try {
    console.log('Deleting image from Google Drive:', data.fileId);
    
    const file = DriveApp.getFileById(data.fileId);
    file.setTrashed(true);
    
    console.log('Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { error: error.toString() };
  }
}

function listImageFiles() {
  try {
    const folder = DriveApp.getFoldersByName('ITEMLOG_Images').next();
    const files = folder.getFiles();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('ImageFileIDs');
    sheet.appendRow(['File Name', 'File ID']);
    while (files.hasNext()) {
      const file = files.next();
      sheet.appendRow([file.getName(), file.getId()]);
    }
    return { success: true, message: 'Image files listed successfully' };
  } catch (error) {
    throw new Error('Error listing image files: ' + error.message);
  }
}

function getPriceStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRICESTOCK');
  if (!sheet) throw new Error('PRICESTOCK sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  });
}

function editPriceStock(params) {
  const id = params.id;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRICESTOCK');
  if (!sheet) throw new Error('PRICESTOCK sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex === -1) throw new Error('Item not found');
  // Update all fields present in params (except id)
  for (let key in params) {
    if (key === 'id') continue;
    const colIdx = headers.indexOf(key);
    if (colIdx !== -1) {
      sheet.getRange(rowIndex, colIdx + 1).setValue(params[key]);
    }
  }
  return { success: true };
}

// Add these functions to your existing Google Apps Script

function getExpenseStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EXPENSESTATUS');
  if (!sheet) {
    throw new Error('EXPENSESTATUS sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Skip header row
  
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  });
}

function addExpenseRequest(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EXPENSESTATUS');
  if (!sheet) {
    throw new Error('EXPENSESTATUS sheet not found');
  }
  
  const pdfData = params.pdfData;
  const items = JSON.parse(params.items);
  const totalAmount = params.totalAmount;
  
  // Format date in Malaysian format
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'dd/MM/yyyy HH:mm:ss');
  
  // Upload PDF to Google Drive (if you use this)
  let pdfUrl = '';
  if (pdfData) {
    try {
      const fileData = Utilities.base64Decode(pdfData);
      const blob = Utilities.newBlob(fileData, 'application/pdf', `expense-request-${Date.now()}.pdf`);
      let folder;
      try {
        folder = DriveApp.getFoldersByName('ExpensePDFs').next();
      } catch (error) {
        folder = DriveApp.createFolder('ExpensePDFs');
      }
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      pdfUrl = file.getUrl();
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  }
  
  // Add each item as a separate row, each with a unique ID (timestamp + index)
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const uniqueId = `${Date.now()}_${i}`; // Unique per item
    const newRow = [
      uniqueId,
      timestamp,
      item.namaBarang,
      item.tier || '',
      item.qty,
      item.price,
      (item.qty * item.price).toFixed(2),
      'PENDING', // status
      pdfUrl
    ];
    sheet.appendRow(newRow);
  }
  
  return { 
    success: true, 
    message: 'Expense request added successfully',
    pdfUrl: pdfUrl
  };
}

function updateExpenseStatus(params) {
  const id = params.id;
  const status = params.status;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EXPENSESTATUS');
  if (!sheet) throw new Error('EXPENSESTATUS sheet not found');
  const data = sheet.getDataRange().getValues();
  let updated = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      // Update status (column 8, index 7)
      sheet.getRange(i + 1, 8).setValue(status);
      updated = true;
      // If status is SUCCESS, also add to EXPENSELOG
      if (status === 'SUCCESS') {
        const expenseLogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EXPENSELOG');
        if (expenseLogSheet) {
          // Copy only the first 7 columns (no status)
          const expenseLogRow = data[i].slice(0, 7);
          expenseLogSheet.appendRow(expenseLogRow);
        }
      }
    }
  }
  if (!updated) throw new Error('Expense request not found');
  return { success: true, message: 'Status updated successfully' };
}

function getExpenseLog() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('EXPENSELOG');
  if (!sheet) throw new Error('EXPENSELOG sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  });
}