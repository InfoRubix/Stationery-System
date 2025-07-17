"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../../page.module.css";
import { getPriceStock, editPriceStock } from "@/lib/google-apps-script";
import React from "react"; // Added missing import for React
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

const ITEMS_PER_PAGE = 10;

export default function PriceStockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [page, setPage] = useState(1);
  const [editName, setEditName] = useState("");
  const [editTypeStock, setEditTypeStock] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");
  const [editTiers, setEditTiers] = useState<{ qty: string; price: string }[]>([{ qty: "", price: "" }]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPriceStock();
  }, []);

  // Focus the search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const fetchPriceStock = async () => {
    setLoading(true);
    try {
      const data = await getPriceStock();
      setItems(data);
    } catch (e) {
      setItems([]);
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

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item["NAMA BARANG"]?.toLowerCase().includes(query) ||
      item["TYPE STOCK"]?.toLowerCase().includes(query) ||
      item["BASE PRICE"]?.toString().includes(query)
    );
  });

  const openEditModal = (item: any) => {
    setModalItem(item);
    setEditName(item["NAMA BARANG"] || "");
    setEditTypeStock(item["TYPE STOCK"] || "");
    setEditBasePrice(item["BASE PRICE"] || "");
    // Load up to 5 tiers from item
    const tiers = [];
    for (let i = 1; i <= 5; i++) {
      const qty = item[`TIER ${i} QTY`] || "";
      const price = item[`TIER ${i} PRICE`] || "";
      if (qty || price) {
        tiers.push({ qty, price });
      }
    }
    setEditTiers(tiers.length ? tiers : [{ qty: "", price: "" }]);
    setModalError("");
  };
  const closeModal = () => {
    setModalItem(null);
    setEditFields({});
    setModalError("");
  };
  const handleFieldChange = (key: string, value: any) => {
    setEditFields(prev => ({ ...prev, [key]: value }));
  };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;
    setModalLoading(true);
    setModalError("");
    try {
      await editPriceStock(modalItem["ID"], editFields);
      closeModal();
      fetchPriceStock();
    } catch (err) {
      setModalError("Failed to update item.");
    } finally {
      setModalLoading(false);
    }
  };

  const headers = items[0] ? Object.keys(items[0]) : [];

  // Pagination logic with filtered items
  const paginatedItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  return (
    <div className={styles.dashboard}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 className={styles.heading}>Price Stock Management</h1>
          <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
            Total Items: {filteredItems.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, margin: '16px 0', flexWrap: 'wrap' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search items..."
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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <div className="flex items-center gap-5 rounded bg-black px-4 py-3 text-white">
                      <DotLoader
                        frames={loaderFrames}
                        className="gap-0.5"
                        dotClassName="dot-loader-dot"
                      />
                    </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600, padding: 32 }}>
            {searchQuery ? 'No items found matching your search.' : 'No price stock data found.'}
          </div>
        ) : (
          <>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>NAMA BARANG</th>
                  <th>BASE PRICE</th>
                  <th>TYPE STOCK</th>
                  <th>TIER QTY</th>
                  <th>TIER PRICE</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => {
                  // Gather all tiers
                  const tiers = [];
                  for (let i = 1; i <= 5; i++) {
                    const qty = item[`TIER ${i} QTY`];
                    const price = item[`TIER ${i} PRICE`];
                    if (qty || price) {
                      tiers.push({ qty, price });
                    }
                  }
                  // Always show at least one row per item
                  const rowNo = (page - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <React.Fragment key={item.ID}>
                      <tr>
                        <td>{rowNo}</td>
                        <td>{item["NAMA BARANG"]}</td>
                        <td>{item["BASE PRICE"]}</td>
                        <td>{item["TYPE STOCK"]}</td>
                        <td>{tiers[0]?.qty || ''}</td>
                        <td>{tiers[0]?.price || ''}</td>
                        <td>
                          <button
                            className={styles.primaryBtn}
                            style={{ fontSize: 13, padding: '6px 16px' }}
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                      {/* Render additional tiers as new rows, but only show qty/price */}
                      {tiers.slice(1).map((tier, idx) => (
                        <tr key={item.ID + '-tier-' + (idx + 2)}>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>{tier.qty}</td>
                          <td>{tier.price}</td>
                          <td></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 16 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '6px 18px', borderRadius: 8, background: page === 1 ? '#e5e7eb' : '#2563eb', color: page === 1 ? '#888' : '#fff', border: 'none', fontWeight: 600 }}
                >
                  Prev
                </button>
                <span style={{ fontWeight: 600 }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '6px 18px', borderRadius: 8, background: page === totalPages ? '#e5e7eb' : '#2563eb', color: page === totalPages ? '#888' : '#fff', border: 'none', fontWeight: 600 }}
                >
                  Next
                </button>
              </div>
            )}
            {/* Edit Modal */}
            {modalItem && (
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
                  <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, textAlign: 'center' }}>
                    Edit Item
                  </h2>
                  <form onSubmit={handleEdit} style={{ width: '100%' }}>
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
                      <label style={{ fontWeight: 500 }}>Type Stock</label>
                      <select
                        value={editTypeStock}
                        onChange={e => setEditTypeStock(e.target.value)}
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Ream">Ream</option>
                        <option value="Unit">Unit</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Pack">Pack</option>
                        <option value="Box">Box</option>
                        <option value="Roll">Roll</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Pad">Pad</option>
                        <option value="gms">gms</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 500 }}>Base Price</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editBasePrice}
                        onChange={e => setEditBasePrice(e.target.value)}
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5eaf1', fontSize: 16 }}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontWeight: 500, display: 'block', marginBottom: 8 }}>Edit Price Tiers</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {editTiers.map((tier, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <label style={{ minWidth: 80, fontWeight: 600 }}>
                              {`Tier ${idx + 1} Qty`}
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="Qty"
                              value={tier.qty}
                              onChange={e => {
                                const newTiers = [...editTiers];
                                newTiers[idx].qty = e.target.value;
                                setEditTiers(newTiers);
                              }}
                              style={{ width: 70, padding: 6, borderRadius: 4, border: '1px solid #e5eaf1', fontSize: 15 }}
                              required
                            />
                            <label style={{ minWidth: 50, fontWeight: 600 }}>Price</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              placeholder="Price"
                              value={tier.price}
                              onChange={e => {
                                const newTiers = [...editTiers];
                                newTiers[idx].price = e.target.value;
                                setEditTiers(newTiers);
                              }}
                              style={{ width: 90, padding: 6, borderRadius: 4, border: '1px solid #e5eaf1', fontSize: 15 }}
                              required
                            />
                            {editTiers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditTiers(editTiers.filter((_, i) => i !== idx));
                                }}
                                style={{ color: '#b91c1c', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', marginLeft: 4 }}
                                aria-label={`Remove Tier ${idx + 1}`}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        {editTiers.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setEditTiers([...editTiers, { qty: '', price: '' }])}
                            style={{ color: '#2563eb', background: 'none', border: '1px solid #2563eb', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
                          >
                            + Add Tier
                          </button>
                        )}
                      </div>
                    </div>
                    {modalError && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{modalError}</div>}
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      style={{ width: '100%', fontSize: 16, padding: '10px 0', marginTop: 8 }}
                      disabled={modalLoading}
                    >
                      {modalLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 