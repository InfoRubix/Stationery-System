# Google Apps Script Setup Guide for Stationery Management System

This guide will help you set up Google Apps Script with PDF generation, proper date formatting, and Document Studio integration.

## Prerequisites

1. A Google Sheets document with the following sheets:
   - **ITEMLOG**: Contains stationery items
   - **LOG**: Contains request logs
2. Google Drive access for PDF storage
3. Google Apps Script access

## Step 1: Set Up Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called "Stationery PDFs"
3. Right-click the folder and select "Share"
4. Set permissions to "Anyone with the link can view"
5. **Copy the folder ID** from the URL (the long string after `/folders/`)

## Step 2: Update Google Apps Script

1. Open your Google Sheets document
2. Go to **Extensions** > **Apps Script**
3. Replace the default code with the content from `simple-apps-script.js`
4. **Important**: Update the folder ID in the `generatePDF` function:
   ```javascript
   const folder = DriveApp.getFolderById('YOUR_FOLDER_ID_HERE'); // Replace with your folder ID
   ```

## Step 3: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Choose **Web app** as the type
3. Set the following:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** - you'll need this for your Next.js app

## Step 4: Update Environment Variables

Update your `.env.local` file:

```env
# Google Apps Script Web App URL
GOOGLE_APPS_SCRIPT_URL=your_web_app_url_here
```

## Step 5: Test the Setup

### Test Date Formatting
Visit: `https://your-web-app-url?action=test`
Expected response:
```json
{
  "message": "Apps Script is working!",
  "timestamp": "09/07/2025 17:09:00"
}
```

### Test PDF Generation
1. Create a test request in your application
2. Approve the request as admin
3. Check the LOG sheet for:
   - **TARIKH DAN MASA**: Should show `DD/MM/YYYY HH:MM:SS` format
   - **Status**: Should update to `ACCEPT`
   - **[Document Studio] File Status**: Should show `GENERATED`
   - **[Document Studio] File Link**: Should contain a Google Drive link

## Features Implemented

### ✅ Date Formatting
- Malaysian date format: `DD/MM/YYYY HH:MM:SS`
- Proper timezone handling

### ✅ PDF Generation
- Automatic PDF generation when request is accepted
- Professional HTML template
- Google Drive storage
- Public sharing links

### ✅ Status Updates
- Real-time status updates in LOG sheet
- Support for ACCEPT/REJECT statuses
- PDF status tracking

### ✅ Document Studio Integration
- File status tracking in Column Z
- File link storage in Column AA
- Automatic PDF naming with request ID

## Troubleshooting

### Common Issues

1. **"Folder not found" error**
   - Make sure you've updated the folder ID in the Apps Script
   - Ensure the folder is shared with "Anyone with link can view"

2. **PDF generation fails**
   - Check Apps Script execution logs
   - Ensure Drive API is enabled in Apps Script
   - Verify folder permissions

3. **Date still shows ISO format**
   - Make sure you've deployed the updated Apps Script
   - Clear browser cache and test again

4. **Status not updating**
   - Check the web app URL is correct
   - Verify the LOG sheet structure matches expected columns

### Testing Commands

Test individual functions:

```bash
# Test date formatting
curl "https://your-web-app-url?action=test"

# Test getting items
curl "https://your-web-app-url?action=getItems"

# Test getting logs
curl "https://your-web-app-url?action=getLogs"
```

### Apps Script Execution Logs

1. In Apps Script editor, click **Executions** in the left sidebar
2. Click on any execution to see detailed logs
3. Look for errors in the execution log

## Security Notes

- The web app is set to "Anyone" access for simplicity
- In production, consider adding authentication
- PDFs are stored in Google Drive with public view access
- Keep the web app URL secure

## Column Structure

### LOG Sheet Expected Columns:
- A: ID
- B: TARIKH DAN MASA
- C: Email
- D: Department
- E-W: Items (10 pairs of name/quantity)
- Y: Status
- Z: [Document Studio] File Status
- AA: [Document Studio] File Link

### ITEMLOG Sheet Expected Columns:
- A: ID
- B: Nama Barang
- C: Bilangan
- D: Image
- E-N: bilLog1-10
- O: Total
- P: Current

## Support

If you encounter issues:

1. Check the Apps Script execution logs
2. Verify all environment variables are set correctly
3. Test the web app URL directly in browser
4. Ensure Google Sheets structure matches expected format 