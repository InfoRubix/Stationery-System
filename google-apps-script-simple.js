// Simplified Google Apps Script backend to support LIMIT field validation
// Copy this code to your Google Apps Script project
// PDF generation now happens on the frontend

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'getItems':
        return ContentService.createTextOutput(JSON.stringify(getItems()));
      case 'getLogs':
        return ContentService.createTextOutput(JSON.stringify(getLogs()));
      case 'getRequests':
        return ContentService.createTextOutput(JSON.stringify(getRequests()));
      case 'getPriceStock':
        return ContentService.createTextOutput(JSON.stringify(getPriceStock()));
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}));
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'addItem':
        return ContentService.createTextOutput(JSON.stringify(addItem(e.parameter)));
      case 'logUsage':
        return ContentService.createTextOutput(JSON.stringify(logUsage(e.parameter)));
      case 'updateLogStatus':
        return ContentService.createTextOutput(JSON.stringify(updateLogStatus(e.parameter)));
      case 'restockItem':
        return ContentService.createTextOutput(JSON.stringify(restockItem(e.parameter)));
      case 'editItem':
        return ContentService.createTextOutput(JSON.stringify(editItem(e.parameter)));
      case 'editPriceStock':
        return ContentService.createTextOutput(JSON.stringify(editPriceStock(e.parameter)));
      default:
        return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}));
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}));
  }
}

// IMPORTANT: Updated to include LIMIT field (column Q)
function getItems() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  const data = sheet.getRange('A2:Q' + sheet.getLastRow()).getValues(); // Changed from P to Q to include LIMIT
  
  return data.map(row => ({
    'ID': row[0] || '',
    'NAMA BARANG': row[1] || '',
    'BILANGAN': parseInt(row[2]) || 0,
    'IMAGE': row[3] || '',
    'BIL LOG 1': parseInt(row[4]) || 0,
    'BIL LOG 2': parseInt(row[5]) || 0,
    'BIL LOG 3': parseInt(row[6]) || 0,
    'BIL LOG 4': parseInt(row[7]) || 0,
    'BIL LOG 5': parseInt(row[8]) || 0,
    'BIL LOG 6': parseInt(row[9]) || 0,
    'BIL LOG 7': parseInt(row[10]) || 0,
    'BIL LOG 8': parseInt(row[11]) || 0,
    'BIL LOG 9': parseInt(row[12]) || 0,
    'BIL LOG 10': parseInt(row[13]) || 0,
    'TOTAL': parseInt(row[14]) || 0,
    'CURRENT': parseInt(row[15]) || 0,
    'LIMIT': parseInt(row[16]) || 0  // NEW: Admin limit field
  }));
}

// Enhanced logUsage with LIMIT validation
function logUsage(params) {
  try {
    const email = params.email;
    const department = params.department;
    const items = JSON.parse(params.items);
    
    // Get ITEMLOG data for validation
    const itemlogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const itemlogData = itemlogSheet.getRange('A:Q').getValues(); // Include LIMIT column
    
    // Validate against admin limits BEFORE processing
    for (const item of items) {
      // Find item row
      let itemRowData = null;
      for (let i = 1; i < itemlogData.length; i++) {
        if (itemlogData[i][1] === item.namaBarang) {
          itemRowData = itemlogData[i];
          break;
        }
      }
      
      if (!itemRowData) {
        return {error: `Item "${item.namaBarang}" not found.`};
      }
      
      const current = parseInt(itemRowData[15]) || 0;
      const limit = parseInt(itemRowData[16]) || 0;
      
      // Check if order exceeds limit (if limit is set)
      const maxAllowed = limit > 0 ? limit : current;
      if (item.bilangan > maxAllowed) {
        const limitType = limit > 0 ? "admin limit" : "available stock";
        return {error: `Quantity for "${item.namaBarang}" exceeds ${limitType} (max: ${maxAllowed}, requested: ${item.bilangan}).`};
      }
    }
    
    // If validation passes, proceed with logging
    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
    const nextId = getNextLogId();
    
    const logRow = [nextId, timestamp, email, department];
    
    // Add items (up to 10)
    for (let i = 0; i < 10; i++) {
      if (i < items.length) {
        logRow.push(items[i].namaBarang, items[i].bilangan);
      } else {
        logRow.push('', 0);
      }
    }
    logRow.push('PENDING'); // Status
    
    logSheet.appendRow(logRow);
    
    // Update ITEMLOG stock levels
    for (const item of items) {
      let itemRow = -1;
      for (let i = 1; i < itemlogData.length; i++) {
        if (itemlogData[i][1] === item.namaBarang) {
          itemRow = i + 1;
          break;
        }
      }
      
      if (itemRow > -1) {
        const current = parseInt(itemlogData[itemRow - 1][15]) || 0;
        const newCurrent = Math.max(0, current - item.bilangan);
        itemlogSheet.getRange(itemRow, 16).setValue(newCurrent); // Column P (CURRENT)
      }
    }
    
    return {
      success: true,
      logId: nextId
    };
  } catch (error) {
    return {error: error.toString()};
  }
}

function getNextLogId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LOG');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const lastId = parseInt(sheet.getRange(lastRow, 1).getValue()) || 0;
  return lastId + 1;
}

// Updated addItem function to include LIMIT column
function addItem(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const nextId = getNextItemId();
    
    const newRow = [
      nextId,
      params.namaBarang,
      parseInt(params.bilangan) || 0,
      params.image || '',
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // bilLog1-10
      0, // total
      parseInt(params.bilangan) || 0, // current
      0  // limit (default to 0, admin can set later)
    ];
    
    sheet.appendRow(newRow);
    return {success: true, id: nextId};
  } catch (error) {
    return {error: error.toString()};
  }
}

function getNextItemId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  
  const lastId = parseInt(sheet.getRange(lastRow, 1).getValue()) || 0;
  return lastId + 1;
}

// Updated editItem function to handle LIMIT column
function editItem(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const data = sheet.getRange('A:A').getValues();
    
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == params.id) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return {error: 'Item not found'};
    }
    
    // Update item details
    if (params.namaBarang) sheet.getRange(targetRow, 2).setValue(params.namaBarang);
    if (params.image) sheet.getRange(targetRow, 4).setValue(params.image);
    if (params.current) sheet.getRange(targetRow, 16).setValue(parseInt(params.current));
    if (params.limit !== undefined) sheet.getRange(targetRow, 17).setValue(parseInt(params.limit)); // NEW: Support LIMIT updates
    
    return {success: true};
  } catch (error) {
    return {error: error.toString()};
  }
}

// Add other existing functions like getLogs, getRequests, restockItem, updateLogStatus, etc.
// Make sure they handle the expanded ITEMLOG structure with LIMIT column

function restockItem(params) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ITEMLOG');
    const data = sheet.getRange('A:A').getValues();
    
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == params.id) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return {error: 'Item not found'};
    }
    
    const currentStock = parseInt(sheet.getRange(targetRow, 16).getValue()) || 0;
    const addQty = parseInt(params.addQty) || 0;
    const newStock = currentStock + addQty;
    
    sheet.getRange(targetRow, 16).setValue(newStock);
    
    return {success: true, newStock: newStock};
  } catch (error) {
    return {error: error.toString()};
  }
}

// Add other required functions (getLogs, getRequests, updateLogStatus, getPriceStock, editPriceStock, etc.)
// based on your existing implementation...