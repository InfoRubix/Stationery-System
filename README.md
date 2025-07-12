# Stationery Ordering System Documentation

## Overview

This is a web-based stationery ordering system built with Next.js, React, and Material UI (MUI). It allows users to browse available stationery items, add them to a cart, and submit an order by providing their email and department. The system ensures that orders do not exceed available stock and provides a responsive, mobile-friendly interface.

---

## Features

- **Browse Items:** Fetches and displays a list of available stationery items from the backend.
- **Cart Management:** Users can add items to their cart, adjust quantities (within available stock), and remove items.
- **Order Submission:** Users submit their order by providing an email and selecting a department.
- **Validation:** Prevents orders with missing information or quantities exceeding stock.
- **Feedback:** Displays loading indicators, error messages, and success notifications.
- **Responsive Design:** Mobile-friendly layout using CSS modules and MUI components.
- **No Authentication:** The system does not require user login or authentication.

---

## File Structure

- `src/app/page.tsx` — Main page for ordering stationery.
- `src/contexts/CartContext.tsx` — Provides cart state and actions via React context.
- `src/components/ui/dot-loader.tsx` — Animated loader component.
- `src/app/api/items/route.ts` — API route for fetching items.
- `src/app/api/requests/route.ts` — API route for submitting orders.
- `src/app/page.module.css` — CSS module for styling the main page.
- `public/ITEMLOG_Images/` — Images for stationery items.

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

### `GET /api/items`

- Returns a list of available stationery items.
- Each item includes:
  - `NAMA BARANG` (name)
  - `CURRENT` (stock)
  - `image` (optional)

### `POST /api/requests`

- Accepts an order with:
  - `email` (string)
  - `department` (string)
  - `items` (array of `{ namaBarang, bilangan }`)
- Validates stock and required fields.
- Returns success or error message.

---

## Customization

- **Departments:** To add or remove departments, edit the `<select>` options in `src/app/page.tsx`.
- **Stock List:** To change how items are fetched or displayed, update the fetch logic and UI in `src/app/page.tsx`.
- **Styling:** Modify `src/app/page.module.css` for custom styles. The system uses CSS modules for scoped, mobile-friendly styles.

---

## Technologies Used

- **Next.js** (App Router)
- **React** (with hooks and context)
- **Material UI (MUI)**
- **CSS Modules**
- **Node.js 16**
- **TypeScript**

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