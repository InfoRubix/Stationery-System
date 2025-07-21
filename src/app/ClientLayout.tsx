"use client";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "../contexts/CartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  // Determine role based on route
  const isAdmin = pathname.startsWith('/admin');
  const role = isAdmin ? 'admin' : 'user';
  return (
    <CartProvider>
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }} suppressHydrationWarning>
        {/* Hamburger menu for mobile - removed to avoid duplicate burger icon */}
        {/* Sidebar overlay for mobile */}
        <div
          className="sidebar-overlay"
          style={{
            display: sidebarOpen ? 'block' : 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 1000,
          }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar */}
        <div
          className="sidebar-wrapper"
          style={{
            position: 'relative',
            zIndex: 1001,
            minHeight: '100vh',
            transition: 'transform 0.3s',
            transform: sidebarOpen ? 'translateX(0)' : '',
          }}
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} role={role} />
        </div>
        {/* Main content */}
        <div className="mainBg" style={{ flex: 1, position: 'relative' }}>
          <main>{children}</main>
        </div>
        <style>{`
          @media (max-width: 900px) {
            .sidebar-wrapper {
              position: fixed !important;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1001;
              background: white;
              box-shadow: 2px 0 16px rgba(0,0,0,0.10);
              transform: translateX(-110%);
              transition: transform 0.3s;
            }
            .sidebar-wrapper[style*="translateX(0)"] {
              transform: translateX(0) !important;
            }
            .sidebar-overlay {
              display: block;
            }
            .hamburger {
              display: none !important;
            }
          }
          @media (min-width: 901px) {
            .sidebar-overlay, .hamburger {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </CartProvider>
  );
} 