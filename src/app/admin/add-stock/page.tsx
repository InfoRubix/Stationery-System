"use client";
import { useState } from "react";
import styles from "../../page.module.css";
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

export default function AddStockPage() {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name || !quantity || !imageFile) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("quantity", quantity);
    formData.append("image", imageFile);

    try {
      const res = await fetch("/api/upload-stock", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add stock");
      setSuccess(true);
      setName("");
      setQuantity("");
      setImageFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      className={styles.dashboard}
    >
      <h1 className={styles.heading} style={{ textAlign: "center" }}>
        Add New Stock
      </h1>
      <div
        style={{
          maxWidth: 420,
          background: "#fff",
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.07)",
          borderRadius: 18,
          padding: "36px 32px",
          marginTop: 32,
        }}
      >
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80, marginBottom: 16 }}>
            <DotLoader
              frames={loaderFrames}
              className="gap-0.5"
              dotClassName="dot-loader-dot"
            />
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className={styles.input}
              min={1}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            {preview && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: 140,
                    borderRadius: 10,
                    boxShadow: "0 2px 8px #0001",
                  }}
                />
              </div>
            )}
          </div>
          {error && (
            <div
              style={{
                color: "#b91c1c",
                background: "#fee2e2",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                color: "#059669",
                background: "#d1fae5",
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              Stock added successfully!
            </div>
          )}
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={loading}
            style={{
              fontWeight: 700,
              fontSize: 18,
              padding: "16px 0",
              borderRadius: 10,
              background: "#2563eb",
              transition: "background 0.2s",
              marginTop: 10,
            }}
          >
            Add Stock
          </button>
        </form>
      </div>
    </div>
  );
}