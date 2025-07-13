# Netlify Image Upload Setup with Google Drive

This guide will help you set up Google Drive image uploads for your stationery management system deployed on Netlify.

## Problem Solved

- **Issue**: Netlify is a static hosting platform that cannot handle server-side file uploads
- **Solution**: Use Google Drive API through Google Apps Script to store images
- **Benefits**: 
  - Works with Netlify's static hosting
  - Integrates with your existing Google Sheets database
  - No server infrastructure needed
  - Scalable and reliable

## Setup Steps

### 1. Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called "Stationery Images" (or any name you prefer)
3. Right-click the folder → Share → Copy link
4. Extract the folder ID from the URL:
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Copy the `FOLDER_ID` part

### 2. Update Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Open your existing project or create a new one
3. Replace the entire code with the script from `GOOGLE_APPS_SCRIPT.md`
4. Update these variables in the script:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';
   ```

### 3. Deploy Google Apps Script

1. Click "Deploy" → "New deployment"
2. Choose "Web app"
3. Set configuration:
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click "Deploy"
5. Copy the web app URL

### 4. Update Application URLs

Update the Google Apps Script URL in these files:
- `src/lib/google-apps-script.ts`
- `src/lib/google-drive.ts`

Replace the existing URL with your new web app URL.

### 5. Test the Setup

1. Deploy your application to Netlify
2. Try uploading an image through the "Add Stock" page
3. Check that:
   - Image appears in your Google Drive folder
   - Image URL is stored in your Google Sheet
   - Image displays correctly in your application

## How It Works

### Image Upload Flow

1. **User uploads image** → Frontend converts to base64
2. **Frontend sends to API** → `/api/upload-stock` endpoint
3. **API calls Google Drive** → Uploads image via Google Apps Script
4. **Google Drive returns URL** → Direct access URL for the image
5. **API saves to Google Sheet** → Stores the image URL in your database
6. **Frontend displays image** → Uses the Google Drive URL

### File Structure

```
src/
├── lib/
│   ├── google-apps-script.ts    # Google Sheets operations
│   └── google-drive.ts          # Google Drive operations
├── app/
│   └── api/
│       └── upload-stock/
│           └── route.ts         # Updated to use Google Drive
```

## Security Considerations

### Google Drive Permissions
- Images are stored with "Anyone with link can view" permissions
- This allows your application to display images without authentication
- Consider implementing additional security if needed

### Google Apps Script Access
- Web app is set to "Anyone" access for Netlify compatibility
- Script runs under your Google account credentials
- No sensitive data is exposed

## Troubleshooting

### Common Issues

1. **"Script not found" error**
   - Check that the Google Apps Script URL is correct
   - Ensure the script is deployed as a web app

2. **"Folder not found" error**
   - Verify the `DRIVE_FOLDER_ID` is correct
   - Ensure you have access to the folder

3. **"Spreadsheet not found" error**
   - Check that the `SPREADSHEET_ID` is correct
   - Ensure the script has access to the spreadsheet

4. **Images not displaying**
   - Check that the image URL is correctly stored in Google Sheets
   - Verify the Google Drive sharing permissions

### Testing Commands

You can test the Google Apps Script directly:

```bash
# Test getting items
curl "YOUR_SCRIPT_URL?action=getItems"

# Test image upload (this would be done by your application)
curl -X POST "YOUR_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"uploadImage","fileName":"test.jpg","fileData":"base64data","mimeType":"image/jpeg"}'
```

## Migration from Local Storage

If you have existing images in your `public/ITEMLOG_Images/` folder:

1. **Upload existing images** to Google Drive manually
2. **Update Google Sheet** with the new Google Drive URLs
3. **Remove local images** from your repository
4. **Update image references** in your code if needed

## Performance Considerations

- **Image size**: Consider compressing images before upload
- **Caching**: Google Drive URLs are cached by browsers
- **Bandwidth**: Large images may take time to upload
- **Rate limits**: Google Apps Script has daily quotas

## Cost Considerations

- **Google Drive**: 15GB free storage (usually sufficient for images)
- **Google Apps Script**: Free tier with daily quotas
- **Netlify**: Free tier for hosting

## Next Steps

After setup, consider these improvements:

1. **Image compression** before upload
2. **Image resizing** for thumbnails
3. **File type validation**
4. **Upload progress indicators**
5. **Error handling and retry logic**

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Google Apps Script logs
3. Test the Google Apps Script URL directly
4. Ensure all IDs and URLs are correct 