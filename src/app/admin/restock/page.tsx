"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../../page.module.css";
import { getItems } from "@/lib/google-apps-script";
import { restockItem } from '@/lib/google-apps-script';
import React from "react";
import { DotLoader } from "@/components/ui/dot-loader";
import { getImageSrc } from "@/lib/getImageSrc";
import { editItem } from "@/lib/google-apps-script";
import { useExpenseCart } from "@/contexts/ExpenseCartContext";
import { getPriceStock } from '@/lib/google-apps-script';

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
const RESTOCK_PAGE_KEY = 'adminRestockPage';

function getInitialPage() {
  if (typeof window !== 'undefined') {
    const savedPage = Number(localStorage.getItem(RESTOCK_PAGE_KEY));
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

export default function AdminRestockPage() {
  const { addToCart } = useExpenseCart();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(getInitialPage());
  const [hasRestoredPage, setHasRestoredPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [modalType, setModalType] = useState<null | 'restock' | 'edit'>(null);
  const [modalItem, setModalItem] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [editCurrent, setEditCurrent] = useState('');
  const [editTargetStock, setEditTargetStock] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editTargetStockModal, setEditTargetStockModal] = useState<{ open: boolean, item: any, value: string }>({ open: false, item: null, value: '' });
  const [expenseCartModal, setExpenseCartModal] = useState<{ open: boolean, item: any }>({ open: false, item: null });
  const [expenseQty, setExpenseQty] = useState(1);
  const [expenseTier, setExpenseTier] = useState('');
  const [priceStockList, setPriceStockList] = useState<any[]>([]);
  const [notification, setNotification] = useState('');

  // Restore last page from localStorage on mount
  useEffect(() => {
    const savedPage = Number(localStorage.getItem(RESTOCK_PAGE_KEY));
    if (!isNaN(savedPage) && savedPage > 0) {
      setPage(savedPage);
    }
    setHasRestoredPage(true);
  }, []);

  // Save page to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (hasRestoredPage) {
      localStorage.setItem(RESTOCK_PAGE_KEY, String(page));
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

  // Fetch PRICESTOCK on mount
  useEffect(() => {
    getPriceStock().then(setPriceStockList).catch(() => setPriceStockList([]));
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
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

  // Open modal handlers
  const openEditModal = (item: any) => {
    setModalType('edit');
    setModalItem(item);
    setEditName(item["NAMA BARANG"] || '');
    setEditImage(null); // Reset image upload
    setEditTargetStock(item["TARGETSTOCK"] || '');
    setEditCurrent(item["CURRENT"] || '');
    setEditLimit(item["LIMIT"] || '');
    setModalError('');
  };
  const openExpenseCartModal = (item: any) => {
    setExpenseCartModal({ open: true, item });
    setExpenseQty(1);
    setExpenseTier('');
  };
  const closeModal = () => {
    setModalType(null);
    setModalItem(null);
    setModalError('');
  };
  const closeExpenseCartModal = () => {
    setExpenseCartModal({ open: false, item: null });
    setExpenseQty(1);
    setExpenseTier('');
  };

  // API call for restock
  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;
    if (restockQty < 1) {
      setModalError('Quantity must be at least 1');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const formData = new FormData();
      formData.append('action', 'restockItem');
      formData.append('id', modalItem["ID"]);
      formData.append('addQty', String(restockQty));
      const res = await fetch('/api/items', {
        method: 'PUT',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to restock');
      closeModal();
      fetchItems();
    } catch (err) {
      setModalError('Failed to restock.');
    } finally {
      setModalLoading(false);
    }
  };

  // API call for edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;
    if (!editName.trim()) {
      setModalError('Name is required');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      // Handle image upload if a new image is selected
      let imageUrl = undefined;
      if (editImage) {
        // Upload image to backend (implement upload logic as in add stock)
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(editImage);
        });
        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData,
            fileName: editImage.name,
            mimeType: editImage.type,
          }),
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.webContentLink) {
          imageUrl = uploadJson.webContentLink;
        }
      }
      // Update ITEMLOG using the library function
      console.log('About to call editItem with limit:', editLimit);
      await editItem(
        modalItem["ID"],
        editName,
        imageUrl || modalItem["IMAGE"] || "",
        editCurrent,
        editTargetStock,
        editLimit,
        modalItem["NAMA BARANG"] // oldName
      );
      closeModal();
      fetchItems();
    } catch (err: any) {
      setModalError('Failed to update item.');
    } finally {
      setModalLoading(false);
    }
  };

  // Expense Cart Modal Tier Options
  function getTierOptions(item: any) {
    const priceStockItem = priceStockList.find(
      (row) => row['NAMA BARANG'] === item['NAMA BARANG']
    );
    if (!priceStockItem) return [];
    const options = [];
    for (let i = 1; i <= 5; i++) {
      const qty = priceStockItem[`TIER ${i} QTY`];
      const price = priceStockItem[`TIER ${i} PRICE`];
      if (qty && price && parseFloat(price) > 0) {
        options.push({
          label: `Tier ${i} - Qty: ${qty}, Price: RM ${parseFloat(price).toFixed(2)}`,
          value: `Tier ${i}`,
          price: parseFloat(price),
          qty: qty
        });
      }
    }
    return options;
  }

  const handleAddToExpenseCart = () => {
    if (!expenseCartModal.item) return;
    const item = expenseCartModal.item;
    let selectedPrice = 0;
    let selectedTier = '';
    // Find the price based on selected tier from PRICESTOCK
    const priceStockItem = priceStockList.find(
      (row) => row['NAMA BARANG'] === item['NAMA BARANG']
    );
    if (expenseTier && priceStockItem) {
      const tierNum = parseInt(expenseTier.split(' ')[1]);
      selectedPrice = parseFloat(priceStockItem[`TIER ${tierNum} PRICE`] || '0');
      selectedTier = expenseTier;
    } else if (priceStockItem) {
      // Use base price if no tier selected
      selectedPrice = parseFloat(priceStockItem['BASE PRICE'] || '0');
      selectedTier = 'Base Price';
    }
    if (selectedPrice <= 0) {
      alert('Please select a valid tier with price');
      return;
    }
    const expenseItem = {
      id: item['ID'],
      namaBarang: item['NAMA BARANG'],
      tier: selectedTier,
      qty: expenseQty,
      price: selectedPrice,
      image: item['IMAGE'] || ''
    };
    addToCart(expenseItem);
    closeExpenseCartModal();
    setNotification('Item added to expense cart!');
    setTimeout(() => setNotification(''), 2500);
  };

  // Helper to get display price for an item
  function getDisplayPrice(item: any) {
    // Try to find the lowest tier price > 0
    for (let i = 1; i <= 5; i++) {
      const price = parseFloat(item[`TIER ${i} PRICE`] || '');
      if (!isNaN(price) && price > 0) return price.toFixed(2);
    }
    // Fallback to base price
    const base = parseFloat(item["BASE PRICE"] || '');
    if (!isNaN(base) && base > 0) return base.toFixed(2);
    return null;
  }

  if (loading) return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
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
      <div className={styles.card}><p style={{ color: "red" }}>{error}</p></div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2563eb',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          zIndex: 2000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
        }}>
          {notification}
        </div>
      )}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.heading}>Restock & Edit Stock</h1>
          <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
            Total Stock: {total}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, margin: '16px 0', flexWrap: 'wrap' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search stock..."
            value={search}
            onChange={handleSearchInput}
            onKeyDown={handleSearchKeyDown}
            className={styles.input}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button
            className={styles.primaryBtn}
            type="button"
            style={{ fontSize: 14, padding: '8px 20px' }}
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        {/* Pagination Controls (match user stock list) */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 24
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
        )}
        {/* Stock Grid (4 items per row, match user) */}
        <div className={styles.restockGrid} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginTop: 8 }}>
          {items.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6b7280', fontSize: 16, padding: 32 }}>
              No items found.
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={item.ID || item.id || item["NAMA BARANG"] || idx} className={styles.cardItem} style={{ width: 220, minHeight: 290, padding: 20, borderRadius: 16, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {getImageSrc(item["IMAGE"]) ? (
                    <img
                      src={getImageSrc(item["IMAGE"]) || ''}
                      alt={item["NAMA BARANG"]}
                      className={styles.itemImage}
                      style={{ cursor: 'pointer', width: 120, height: 120, objectFit: 'contain', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onClick={() => openImageModal(item["IMAGE"], item["NAMA BARANG"])}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = "flex";
                        }
                      }}
                    />
                  ) : (
                    <div style={{ 
                      display: "flex",
                      alignItems: "center", 
                      justifyContent: "center",
                      width: 120,
                      height: 120,
                      background: "#e5eaf1",
                      borderRadius: "8px",
                      color: "#64748b",
                      fontSize: "0.85rem"
                    }}>
                      No Image
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 15, textAlign: 'center', marginTop: 4 }}>{item["NAMA BARANG"]}</div>
                  {getDisplayPrice(item) && (
                    <div style={{ color: '#059669', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                      Price: RM {getDisplayPrice(item)}
                    </div>
                  )}
                  {/* Only show Current Stock, remove Target Stock and related UI */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: 8,
                    width: '100%',
                  }}>
                    <span style={{ marginRight: 6 }}>Current: {item["CURRENT"]}</span>  
                    <span style={{ marginRight: 6 }}>Target Stock: {item["TARGETSTOCK"]}</span>
                    {(() => {
                      const current = parseInt(item["CURRENT"]) || 0;
                      const target = parseInt(item["TARGETSTOCK"]) || 0;
                      if (target > 0 && current < target) {
                        return (
                          <div style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginTop: '4px',
                            textAlign: 'center'
                          }}>
                            ⚠️ Low Stock: {target - current} needed
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className={styles.primaryBtn} style={{ fontSize: 12, padding: '4px 14px' }} onClick={() => openEditModal(item)}>Edit</button>
                    <button 
                      className={styles.primaryBtn} 
                      style={{ fontSize: 12, padding: '4px 14px', background: '#8b5cf6', border: '1px solid #8b5cf6' }} 
                      onClick={() => openExpenseCartModal(item)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Image Modal (move outside grid for correct overlay) */}
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
      {/* Restock/Edit Modal */}
      {modalType && modalItem && (
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
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 400,
              width: "100%",
              background: "white",
              borderRadius: "12px",
              padding: "28px 24px 24px 24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={closeModal}
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
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
              {modalType === 'restock' ? 'Restock Item' : 'Edit Item'}
            </h2>
            <form onSubmit={modalType === 'restock' ? handleRestock : handleEdit} style={{ width: '100%' }}>
              {modalType === 'restock' ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Item Name</label>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{modalItem["NAMA BARANG"]}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Add Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={restockQty}
                      onChange={e => setRestockQty(Number(e.target.value))}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Item Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Edit Current Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={editCurrent}
                      onChange={e => setEditCurrent(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Target Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={editTargetStock}
                      onChange={e => setEditTargetStock(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Admin Limit (0 = no limit)</label>
                    <input
                      type="number"
                      min={0}
                      value={editLimit}
                      onChange={e => setEditLimit(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500 }}>Change Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setEditImage(e.target.files?.[0] || null)}
                      disabled={modalLoading}
                    />
                  </div>
                </>
              )}
              {modalError && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{modalError}</div>}
              <button
                type="submit"
                className={styles.primaryBtn}
                style={{ width: '100%', fontSize: 16, padding: '10px 0', marginTop: 8 }}
                disabled={modalLoading}
              >
                {modalLoading ? 'Processing...' : modalType === 'restock' ? 'Restock' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Target Stock Edit Modal */}
      {editTargetStockModal.open && (
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
          onClick={e => { if (e.target === e.currentTarget) setEditTargetStockModal({ open: false, item: null, value: '' }); }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 340,
              width: "100%",
              background: "white",
              borderRadius: "12px",
              padding: "28px 24px 24px 24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setEditTargetStockModal({ open: false, item: null, value: '' })}
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
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 18, textAlign: 'center' }}>
              Edit Target Stock
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editTargetStockModal.item) return;
                try {
                  await editItem(
                    editTargetStockModal.item["ID"],
                    editTargetStockModal.item["NAMA BARANG"],
                    editTargetStockModal.item["IMAGE"] || '',
                    editTargetStockModal.item["CURRENT"] || '',
                    editTargetStockModal.value,
                    editTargetStockModal.item["LIMIT"] || '',
                    editTargetStockModal.item["NAMA BARANG"] // oldName
                  );
                  setEditTargetStockModal({ open: false, item: null, value: '' });
                  fetchItems();
                } catch (err) {
                  alert('Failed to update target stock.');
                }
              }}
              style={{ width: '100%' }}
            >
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Target Stock</label>
                <input
                  type="number"
                  min={0}
                  value={editTargetStockModal.value}
                  onChange={e => setEditTargetStockModal(modal => ({ ...modal, value: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.primaryBtn}
                style={{ width: '100%', fontSize: 16, padding: '10px 0', marginTop: 8 }}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Expense Cart Modal */}
      {expenseCartModal.open && expenseCartModal.item && (
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
          onClick={e => { if (e.target === e.currentTarget) closeExpenseCartModal(); }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 400,
              width: "100%",
              background: "white",
              borderRadius: "12px",
              padding: "28px 24px 24px 24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={closeExpenseCartModal}
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
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
              Add to Expense Cart
            </h2>
            <div style={{ width: '100%' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Item Name</label>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{expenseCartModal.item["NAMA BARANG"]}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Select Tier</label>
                <select
                  value={expenseTier}
                  onChange={e => setExpenseTier(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                >
                  <option value="">Base Price (RM {(() => {
                    const priceStockItem = priceStockList.find(
                      (row) => row['NAMA BARANG'] === expenseCartModal.item['NAMA BARANG']
                    );
                    return priceStockItem ? priceStockItem['BASE PRICE'] : '0';
                  })()})</option>
                  {getTierOptions(expenseCartModal.item).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500 }}>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={expenseQty}
                  onChange={e => setExpenseQty(Number(e.target.value))}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                  required
                />
              </div>
              <button
                onClick={handleAddToExpenseCart}
                className={styles.primaryBtn}
                style={{ width: '100%', fontSize: 16, padding: '10px 0', marginTop: 8, background: '#8b5cf6', border: '1px solid #8b5cf6' }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <ScrollToTopButton />
    </div>
  );
} 