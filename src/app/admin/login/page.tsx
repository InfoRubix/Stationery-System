"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "admin@ahs.com"; // Change to your admin email
const ADMIN_PASSWORD = "admin123"; // Change to your admin password

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_logged_in", "true");
      router.push("/admin");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
      <form onSubmit={handleSubmit} style={{ background: "white", padding: 32, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", minWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 6 }}>Admin Login</h2>
          <button onClick={() => router.push("/")} style={{ background: "black", color: "white", fontWeight: 600, fontSize: 12, padding: "10px", border: "none", borderRadius: 8, marginBottom: 4 }}> back to home </button>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5eaf1", fontSize: 16, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e5eaf1", fontSize: 16, marginTop: 4 }}
          />
        </div>
        {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: "100%", background: "#2563eb", color: "white", fontWeight: 600, fontSize: 16, padding: "10px 0", border: "none", borderRadius: 8, marginTop: 8 }}>
          Login
        </button>
      </form>
    </div>
  );
} 