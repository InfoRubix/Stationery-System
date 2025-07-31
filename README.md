# Stationery Ordering System Documentation

## Overview

This is a comprehensive web-based stationery management system built with Next.js, React, and Material UI (MUI). It provides both user-facing ordering functionality and a complete admin dashboard for inventory management, expense tracking, and analytics. The system integrates with Google Services (Sheets, Drive, Apps Script) for data storage and management.

---

## Features

### User Features
- **Browse Items:** Fetches and displays a list of available stationery items from the backend.
- **Cart Management:** Users can add items to their cart, adjust quantities (within available stock), and remove items.
- **Order Submission:** Users submit their order by providing an email and selecting a department.
- **PDF Generation:** Automatically generates PDF receipts for orders.
- **Stock Status:** Shows real-time stock availability and out-of-stock items.
- **Responsive Design:** Mobile-friendly layout using CSS modules and MUI components.

### Admin Features
- **Admin Dashboard:** Analytics dashboard with charts showing order statistics and inventory data.
- **User Requests Management:** View and manage all user orders and requests.
- **Stock Management:** Add new stock, restock existing items, and manage inventory levels.
- **Price & Stock Control:** Update item prices and stock quantities.
- **Low Stock Alerts:** Monitor items with low inventory levels.
- **Expense Tracking:** Track and manage expenses with cart functionality.
- **Log History:** View detailed logs of all system activities.
- **Image Upload:** Upload and manage product images.
- **Google Integration:** Sync data with Google Sheets and Drive.

---

## File Structure

### Frontend Structure
- `src/app/page.tsx` — Main user ordering page
- `src/app/stock/page.tsx` — Stock browsing page
- `src/app/out-stock/page.tsx` — Out of stock items page
- `src/app/admin/` — Complete admin panel with multiple pages:
  - `page.tsx` — Admin dashboard with analytics
  - `login/page.tsx` — Admin authentication
  - `user-requests/page.tsx` — Manage user orders
  - `add-stock/page.tsx` — Add new inventory
  - `restock/page.tsx` — Restock existing items
  - `price-stock/page.tsx` — Manage prices and stock
  - `low-stock/page.tsx` — Low inventory alerts
  - `expense-cart/page.tsx` — Expense management
  - `expense-status/page.tsx` — Expense tracking
  - `log-history/page.tsx` — System activity logs

### Components & Contexts
- `src/contexts/CartContext.tsx` — User cart state management
- `src/contexts/ExpenseCartContext.tsx` — Admin expense cart management
- `src/components/Sidebar.tsx` — Admin navigation sidebar
- `src/components/UserMenu.tsx` — User menu component
- `src/components/ui/dot-loader.tsx` — Animated loading component

### API Routes
- `src/app/api/items/route.ts` — Item management
- `src/app/api/requests/route.ts` — Order submissions
- `src/app/api/expenses/route.ts` — Expense tracking
- `src/app/api/expenselog/route.ts` — Expense logging
- `src/app/api/logs/route.ts` — System logs
- `src/app/api/price-stock/route.ts` — Price and stock management
- `src/app/api/upload-stock/route.ts` — Stock uploads

### Libraries & Utilities
- `src/lib/google-apps-script.ts` — Google Apps Script integration
- `src/lib/google-sheets.ts` — Google Sheets API integration
- `src/lib/google-drive.ts` — Google Drive API integration
- `src/lib/getImageSrc.ts` — Image source utilities
- `src/utils/cardStyles.ts` — Reusable card styling

### Assets
- `public/ITEMLOG_Images/` — Product images
- `src/app/page.module.css` — Main page styles
- `src/components/Sidebar.module.css` — Sidebar styles

---

## How It Works

### 1. Fetching Items

- On page load, the system fetches all available items from `/api/items`.
- Items are displayed with their name, image, and current stock.

### 2. Cart Operations

- Users can add items to their cart from the stock list (not shown in this file, but implied).
- In the cart, users can:
  - Adjust the quantity (cannot exceed available stock).
  - Remove items.
  - Clear the entire cart.

### 3. Order Form

- Users must enter their email and select a department.
- The form validates:
  - Email and department are required.
  - At least one item must be in the cart.
  - Quantities do not exceed available stock.

### 4. Submitting an Order

- On submission, the system sends a POST request to `/api/requests` with the order details.
- If successful:
  - The cart is cleared.
  - A success message is shown.
  - The user is redirected to the homepage after 2 seconds.
- If there is an error, an error message is displayed.

---

## API Endpoints

### Item Management
- `GET /api/items` — Fetch stationery items with pagination and filtering
- `POST /api/upload-stock` — Upload new stock items or update existing inventory

### Order Management
- `POST /api/requests` — Submit user orders with email, department, and items
- Validates stock availability and required fields

### Price & Stock Management
- `GET/POST /api/price-stock` — Manage item prices and stock quantities
- Supports bulk updates and individual item modifications

### Expense Tracking
- `GET/POST /api/expenses` — Track and manage expense records
- `GET/POST /api/expenselog` — Log expense activities and generate reports

### System Logging
- `GET/POST /api/logs` — System activity logs and audit trails
- Tracks user actions, stock changes, and system events

### Data Format Examples

**Item Object:**
```json
{
  "NAMA BARANG": "Pen - Blue",
  "CURRENT": 25,
  "PRICE": 2.50,
  "image": "pen-blue.jpg"
}
```

**Order Request:**
```json
{
  "email": "user@company.com",
  "department": "IT",
  "items": [
    {"namaBarang": "Pen - Blue", "bilangan": 5}
  ]
}
```

---

## Customization

- **Departments:** To add or remove departments, edit the `<select>` options in `src/app/page.tsx`.
- **Stock List:** To change how items are fetched or displayed, update the fetch logic and UI in `src/app/page.tsx`.
- **Styling:** Modify `src/app/page.module.css` for custom styles. The system uses CSS modules for scoped, mobile-friendly styles.

---

## Technologies Used

- **Next.js 15.3.5** (App Router with Turbopack)
- **React 19** (with hooks and context)
- **Material UI (MUI) 7.2.0**
- **Chart.js 4.5.0** (with react-chartjs-2 for analytics)
- **TypeScript 5**
- **Google APIs** (Sheets, Drive, Apps Script integration)
- **jsPDF 3.0.1** (PDF generation)
- **PDF-lib 1.17.1** (PDF manipulation)
- **Formidable 3.5.4** (File upload handling)
- **CSS Modules**
- **Netlify** (Deployment platform)

---

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Notes

- No authentication is required for any page.
- The system is designed for internal use (e.g., within an organization).
- For further customization or integration, refer to the code in the `src/app` and `src/contexts` directories.

---

## License & Terms

This software is proprietary to RUBIX TECHNOLOGY. Unauthorized reproduction, distribution, or modification is prohibited. For licensing inquiries, please contact RUBIX TECHNOLOGY directly.

---

**© 2025 RUBIX TECHNOLOGY. All right reserved.**