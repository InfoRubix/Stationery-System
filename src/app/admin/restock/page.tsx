"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../../page.module.css";
import { getItems } from "@/lib/google-apps-script";
import { restockItem } from '@/lib/google-apps-script';
import React from "react";
import { DotLoader } from "@/components/ui/dot-loader";

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
  const [editImage, setEditImage] = useState('');
  const [restockQty, setRestockQty] = useState(1);

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
  const openRestockModal = (item: any) => {
    setModalType('restock');
    setModalItem(item);
    setRestockQty(1);
    setModalError('');
  };
  const openEditModal = (item: any) => {
    setModalType('edit');
    setModalItem(item);
    setEditName(item["NAMA BARANG"] || '');
    setEditImage(item["IMAGE"] || '');
    setModalError('');
  };
  const closeModal = () => {
    setModalType(null);
    setModalItem(null);
    setModalError('');
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
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restock',
          id: modalItem["ID"],
          addQty: restockQty
        })
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
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id: modalItem["ID"],
          namaBarang: editName,
          image: editImage
        })
      });
      if (!res.ok) throw new Error('Failed to edit item');
      closeModal();
      fetchItems();
    } catch (err) {
      setModalError('Failed to edit item.');
    } finally {
      setModalLoading(false);
    }
  };

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
                  {item["IMAGE"] && (
                    <img
                      src={`/${item["IMAGE"]}`}
                      alt={item["NAMA BARANG"]}
                      className={styles.itemImage}
                      style={{ cursor: 'pointer', width: 120, height: 120, objectFit: 'contain', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      onClick={() => openImageModal(item["IMAGE"], item["NAMA BARANG"])}
                    />
                  )}
                  <div style={{ fontWeight: 600, fontSize: 15, textAlign: 'center', marginTop: 4 }}>{item["NAMA BARANG"]}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Current: {item["CURRENT"]}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className={styles.primaryBtn} style={{ fontSize: 12, padding: '4px 14px' }} onClick={() => openEditModal(item)}>Edit</button>
                    <button className={styles.acceptBtn} style={{ fontSize: 12, padding: '4px 14px' }} onClick={() => openRestockModal(item)}>Restock</button>
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
                src={`/${selectedImage.src}`}
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
              alignItems: "center"
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
                    <label style={{ fontWeight: 500 }}>Image Path</label>
                    <input
                      type="text"
                      value={editImage}
                      onChange={e => setEditImage(e.target.value)}
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
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
      </div>
      <ScrollToTopButton />
    </div>
  );
} 