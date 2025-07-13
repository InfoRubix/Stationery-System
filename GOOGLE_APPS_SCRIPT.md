# Google Apps Script for Stationery Management System

This Google Apps Script handles both Google Sheets operations and Google Drive image uploads for the stationery management system.

## Setup Instructions

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Replace the default code with the script below
4. Deploy as a web app with the following settings:
   - Execute as: "Me"
   - Who has access: "Anyone"
5. Copy the web app URL and update it in your application

## Complete Google Apps Script Code

```javascript
// Google Apps Script for Stationery Management System
// Handles both Google Sheets operations and Google Drive image uploads

// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual spreadsheet ID
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE'; // Replace with your Google Drive folder ID

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getItems':
        return ContentService.createTextOutput(JSON.stringify(getItems())).setMimeType(ContentService.MimeType.JSON);
      case 'getLogs':
        return ContentService.createTextOutput(JSON.stringify(getLogs())).setMimeType(ContentService.MimeType.JSON);
      case 'getRequests':
        return ContentService.createTextOutput(JSON.stringify(getRequests())).setMimeType(ContentService.MimeType.JSON);
      default:
        return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  try {
    switch (action) {
      case 'addItem':
        return ContentService.createTextOutput(JSON.stringify(addItemToSheet(data))).setMimeType(ContentService.MimeType.JSON);
      case 'logUsage':
        return ContentService.createTextOutput(JSON.stringify(logUsageToSheet(data))).setMimeType(ContentService.MimeType.JSON);
      case 'updateLogStatus':
        return ContentService.createTextOutput(JSON.stringify(updateLogStatusInSheet(data))).setMimeType(ContentService.MimeType.JSON);
      case 'restockItem':
        return ContentService.createTextOutput(JSON.stringify(restockItemInSheet(data))).setMimeType(ContentService.MimeType.JSON);
      case 'editItem':
        return ContentService.createTextOutput(JSON.stringify(editItemInSheet(data))).setMimeType(ContentService.MimeType.JSON);
      case 'uploadImage':
        return ContentService.createTextOutput(JSON.stringify(uploadImageToDrive(data))).setMimeType(ContentService.MimeType.JSON);
      case 'deleteImage':
        return ContentService.createTextOutput(JSON.stringify(deleteImageFromDrive(data))).setMimeType(ContentService.MimeType.JSON);
      default:
        return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Google Sheets Operations
function getItems() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ITEMLOG');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {
      id: row[0],
      namaBarang: row[1],
      bilangan: row[2],
      image: row[3],
      bilLog1: row[4],
      bilLog2: row[5],
      bilLog3: row[6],
      bilLog4: row[7],
      bilLog5: row[8],
      bilLog6: row[9],
      bilLog7: row[10],
      bilLog8: row[11],
      bilLog9: row[12],
      bilLog10: row[13],
      total: row[14],
      current: row[15]
    };
    items.push(item);
  }
  
  return items;
}

function getLogs() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const logs = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const log = {
      id: row[0],
      tarikhDanMasa: row[1],
      email: row[2],
      department: row[3],
      items: JSON.parse(row[4] || '[]'),
      status: row[5]
    };
    logs.push(log);
  }
  
  return logs;
}

function getRequests() {
  const logs = getLogs();
  return logs.filter(log => log.status === 'PENDING');
}

function addItemToSheet(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ITEMLOG');
  const newRow = [
    new Date().getTime(), // ID
    data.namaBarang,
    data.bilangan,
    data.image,
    data.bilangan, // bilLog1
    0, // bilLog2
    0, // bilLog3
    0, // bilLog4
    0, // bilLog5
    0, // bilLog6
    0, // bilLog7
    0, // bilLog8
    0, // bilLog9
    0, // bilLog10
    data.bilangan, // total
    data.bilangan  // current
  ];
  
  sheet.appendRow(newRow);
  return { success: true };
}

function logUsageToSheet(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG');
  const items = JSON.parse(data.items);
  
  const newRow = [
    new Date().getTime(), // ID
    new Date().toISOString(), // tarikhDanMasa
    data.email,
    data.department,
    JSON.stringify(items),
    'PENDING'
  ];
  
  sheet.appendRow(newRow);
  
  // Update ITEMLOG quantities
  updateItemQuantities(items);
  
  return { success: true };
}

function updateLogStatusInSheet(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('LOG');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      sheet.getRange(i + 1, 6).setValue(data.status);
      
      if (data.status === 'APPROVE') {
        const items = JSON.parse(data.items);
        updateItemQuantities(items);
      }
      break;
    }
  }
  
  return { success: true };
}

function restockItemInSheet(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ITEMLOG');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      const currentQty = dataRange[i][15]; // current column
      const newQty = currentQty + data.addQty;
      
      sheet.getRange(i + 1, 16).setValue(newQty); // current
      sheet.getRange(i + 1, 15).setValue(newQty); // total
      break;
    }
  }
  
  return { success: true };
}

function editItemInSheet(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ITEMLOG');
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.namaBarang); // namaBarang
      sheet.getRange(i + 1, 4).setValue(data.image); // image
      break;
    }
  }
  
  return { success: true };
}

function updateItemQuantities(items) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('ITEMLOG');
  const dataRange = sheet.getDataRange().getValues();
  
  items.forEach(item => {
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][1] === item.namaBarang) {
        const currentQty = dataRange[i][15]; // current column
        const newQty = Math.max(0, currentQty - item.bilangan);
        
        sheet.getRange(i + 1, 16).setValue(newQty); // current
        break;
      }
    }
  });
}

// Google Drive Operations
function uploadImageToDrive(data) {
  try {
    // Decode base64 data
    const fileData = Utilities.base64Decode(data.fileData);
    const blob = Utilities.newBlob(fileData, data.mimeType, data.fileName);
    
    // Get the target folder
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    // Create file in the folder
    const file = folder.createFile(blob);
    
    // Set file permissions to anyone with the link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      id: file.getId(),
      name: file.getName(),
      webViewLink: file.getUrl(),
      webContentLink: `https://drive.google.com/uc?export=view&id=${file.getId()}`
    };
  } catch (error) {
    return { error: error.toString() };
  }
}

function deleteImageFromDrive(data) {
  try {
    const file = DriveApp.getFileById(data.fileId);
    file.setTrashed(true);
    
    return { success: true };
  } catch (error) {
    return { error: error.toString() };
  }
}
```

## Configuration Steps

1. **Get Spreadsheet ID**: Open your Google Sheet and copy the ID from the URL
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Replace `SPREADSHEET_ID` in the script

2. **Create Google Drive Folder**: 
   - Go to Google Drive
   - Create a new folder for storing images
   - Right-click the folder → Share → Copy link
   - Extract the folder ID from the URL
   - Replace `DRIVE_FOLDER_ID` in the script

3. **Deploy the Script**:
   - Click "Deploy" → "New deployment"
   - Choose "Web app"
   - Set "Execute as" to your account
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
   - Copy the web app URL

4. **Update Your Application**:
   - Replace the `APPS_SCRIPT_URL` in your application files with the new web app URL

## Security Notes

- The script uses "Anyone" access for the web app, which is necessary for Netlify deployment
- Images are stored in a dedicated Google Drive folder with "Anyone with link can view" permissions
- Consider implementing additional authentication if needed for production use

## Testing

After deployment, test the image upload functionality:
1. Try uploading an image through your application
2. Check that the image appears in your Google Drive folder
3. Verify that the image URL is correctly stored in your Google Sheet
4. Confirm that images display properly in your application 