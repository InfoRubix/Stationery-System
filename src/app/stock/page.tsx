"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../page.module.css";
import { useCart } from "../../contexts/CartContext";
import { DotLoader } from "@/components/ui/dot-loader";
import { getImageSrc } from "@/lib/getImageSrc";
import { getItemCardStyle, handleItemCardHover, isMobile, getBaseCardStyle, handleCardHover } from "@/utils/cardStyles";

const loaderFrames = [
    [14, 7, 0, 8, 6, 13, 20],
    [14, 7, 13, 20, 16, 27, 21],
    [14, 20, 27, 21, 34, 24, 28],
    [27, 21, 34, 28, 41, 32, 35],
    [34, 28, 41, 35, 48, 40, 42],
    [34, 28, 41, 35, 48, 42, 46],
    [34, 28, 41, 35, 48, 42, 38],
    [34, 28, 41, 35, 48, 30, 21],
    [34, 28, 41, 48, 21, 22, 14],
    [34, 28, 41, 21, 14, 16, 27],
    [34, 28, 21, 14, 10, 20, 27],
    [28, 21, 14, 4, 13, 20, 27],
    [28, 21, 14, 12, 6, 13, 20],
    [28, 21, 14, 6, 13, 20, 11],
    [28, 21, 14, 6, 13, 20, 10],
    [14, 6, 13, 20, 9, 7, 21],
];

const ITEMS_PER_PAGE = 8;
const STOCK_PAGE_KEY = 'stockListPage';

function getInitialPage() {
  if (typeof window !== 'undefined') {
    const savedPage = Number(localStorage.getItem(STOCK_PAGE_KEY));
    if (!isNaN(savedPage) && savedPage > 0) {
      return savedPage;
    }
  }
  return 1;
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible || !isMobile) return null;
  return (
    <button style={{ fontSize: '20px'}}
      className={styles.scrollToTopBtn}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}

export default function StockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // input value
  const [searchQuery, setSearchQuery] = useState(""); // triggers fetch
  const [page, setPage] = useState(1);
  const [hasRestoredPage, setHasRestoredPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { addToCart, isInCart, getCartTotal, cartItems } = useCart();

  // Restore last page from localStorage on mount
  useEffect(() => {
    const savedPage = Number(localStorage.getItem(STOCK_PAGE_KEY));
    if (!isNaN(savedPage) && savedPage > 0) {
      setPage(savedPage);
    }
    setHasRestoredPage(true);
  }, []);

  // Save page to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (hasRestoredPage) {
      localStorage.setItem(STOCK_PAGE_KEY, String(page));
    }
  }, [page, hasRestoredPage]);

  // Focus the search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch items when page or searchQuery changes
  useEffect(() => {
    fetchItems();
  }, [page, searchQuery]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
        inStock: 'true',
      });
      if (searchQuery.trim() !== "") {
        params.append("search", searchQuery);
      }
      const response = await fetch(`/api/items?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    setSearchQuery(search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openImageModal = (src: string, alt: string) => {
    setSelectedImage({ src, alt });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Close modal when clicking outside the image
  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedImage]);

  if (loading) return (
    <div className={styles.dashboard}>
      <div style={getBaseCardStyle(isMobile())} {...handleCardHover}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
          <DotLoader
            frames={loaderFrames}
            className="gap-0.5"
            dotClassName="dot-loader-dot"
          />
        </div>
      </div>
    </div>
  );
  if (error) return (
    <div className={styles.dashboard}>
      <div style={getBaseCardStyle(isMobile())} {...handleCardHover}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <div style={getBaseCardStyle(isMobile())} {...handleCardHover}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
      <h1 className={styles.heading}>Stock List</h1>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div suppressHydrationWarning
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              background: cartItems.length >= 10 ? '#fef3c7' : '#f3f4f6',
              borderRadius: '20px',
              fontSize: '14px',
              marginBottom: '5px',
              fontWeight: 500,
              color: cartItems.length >= 10 ? '#92400e' : '#374151'
            }}>
          Total Stock: {total}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            suppressHydrationWarning
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              background: cartItems.length >= 10 ? '#fef3c7' : '#f3f4f6',
              borderRadius: '20px',
              fontSize: '14px',
              marginBottom: '5px',
              fontWeight: 500,
              color: cartItems.length >= 10 ? '#92400e' : '#374151'
            }}
          >
            <span>🛒{getCartTotal()} items in cart ({cartItems.length}/10)</span>
          </div>
        </div>
      </span>
      
      </div>
      {/* Responsive Pagination Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={styles.primaryBtn}
            style={{
              flex: 1,
              minWidth: 90,
              opacity: page === 1 ? 0.5 : 1,
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "12px",
              padding: "12px 0",
              borderRadius: 8
            }}
          >
            Prev
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 90,
              fontSize: "12px",
              fontWeight: 500,
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #e5eaf1",
              padding: "12px 0"
            }}
          >
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className={styles.primaryBtn}
            style={{
              flex: 1,
              minWidth: 90,
              opacity: page === totalPages ? 0.5 : 1,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "12px",
              padding: "12px 0",
              borderRadius: 8
            }}
          >
            Next
          </button>
        </div>
      <div className={styles.searchRow}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search item name..."
          value={search}
          onChange={handleSearchInput}
          onKeyDown={handleSearchKeyDown}
          className={styles.searchInput}
        />
        <button
          className={styles.primaryBtn + ' ' + styles.searchButton}
          type="button"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          {items.filter(item => Number(item["CURRENT"]) > 0).map(item => {
            const itemName = item["NAMA BARANG"];
            const imagePath = item["IMAGE"]; // Use the IMAGE column from Google Sheets
            const imageSrc = getImageSrc(imagePath);
            const mobile = isMobile();
            
            return (
              <div
                key={item["ID"]}
                style={{
                  ...getItemCardStyle(mobile),
                  textAlign: "center",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                {...handleItemCardHover}
              >
                <div style={{ 
                  height: "120px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  marginBottom: "12px"
                }}>
                  {imageSrc ? (
                    <img
                      src={imageSrc || ''}
                      alt={itemName}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "transform 0.2s ease-in-out"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      onClick={() => openImageModal(imagePath, itemName)}
                      onError={(e) => {
                        // Hide image on error and show placeholder
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div style={{ 
                    display: imageSrc ? "none" : "flex",
                    alignItems: "center", 
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    background: "#e5eaf1",
                    borderRadius: "8px",
                    color: "#64748b",
                    fontSize: "0.85rem"
                  }}>
                    No Image
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 8 }}>{itemName}</div>
                <div style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: 12 }}>Stock: <b>{item["CURRENT"]}</b></div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart({
                      id: item["ID"],
                      namaBarang: itemName,
                      bilangan: 1,
                      image: item["IMAGE"],
                      current: item["CURRENT"],
                      limit: item["LIMIT"] || 0
                    });
                  }}
                  suppressHydrationWarning
                  disabled={item["CURRENT"] === 0 || isInCart(item["ID"]) || cartItems.length >= 10}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isInCart(item["ID"]) ? '#10b981' : cartItems.length >= 10 ? '#6b7280' : '#3b82f6',
                    color: 'white',
                    fontWeight: 600,
                    cursor: isInCart(item["ID"]) || item["CURRENT"] === 0 || cartItems.length >= 10 ? 'default' : 'pointer',
                    opacity: isInCart(item["ID"]) || item["CURRENT"] === 0 || cartItems.length >= 10 ? 0.7 : 1,
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isInCart(item["ID"]) ? '✓ Added to Cart' : 
                   item["CURRENT"] === 0 ? 'Out of Stock' : 
                   cartItems.length >= 10 ? 'Cart Full (10/10)' : 'Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Image Modal */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}
          onClick={handleModalClick}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <button
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                zIndex: 1001,
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.1)"
              }}
              aria-label="Close modal"
            >
              ×
            </button>
            <img
              src={getImageSrc(selectedImage.src) || ''}
              alt={selectedImage.alt}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: "8px"
              }}
            />
            <div style={{ 
              marginTop: "15px", 
              textAlign: "center", 
              fontWeight: 600, 
              fontSize: "1.1rem",
              color: "#374151"
            }}>
              {selectedImage.alt}
            </div>
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
} 