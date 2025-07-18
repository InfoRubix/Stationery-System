"use client";
import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { getItems } from '@/lib/google-apps-script';
import { DotLoader } from "@/components/ui/dot-loader";
import Link from 'next/link';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useRouter } from 'next/navigation';

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

interface RequestItem {
  namaBarang: string;
  bilangan: number;
}

type RequestStatus = 'PENDING' | 'APPROVE' | 'DECLINE' | 'APPLY';

interface Request {
  id: number;
  email: string;
  department: string;
  items: RequestItem[];
  status: RequestStatus;
}

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const router = useRouter();

  // Fetch live low stock items
  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const allItems = await getItems();
        const lowStock = allItems.filter((item: any) => Number(item["CURRENT"]) <= 5);
        setLowStockItems(lowStock);
      } catch (e) {
        setLowStockItems([]);
      }
    };
    fetchLowStock();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await res.json();
      // Sort requests in descending order (latest first)
      const sortedRequests = data.sort((a: Request, b: Request) => b.id - a.id);
      setRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setReqLoading(false);
    }
  };

  // Accept/reject user request
  const handleRequestAction = async (id: number, action: 'APPROVE' | 'DECLINE') => {
    if (actionLoading !== null) return;
    setActionLoading(id);
    try {
      // Find the full request object
      const reqObj = requests.find(r => r.id === id);
      if (!reqObj) throw new Error('Request not found');
      // Optimistic update
      setRequests(prev => 
        prev.map(req => 
          req.id === id ? { ...req, status: action } : req
        )
      );
      await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: action,
          email: reqObj.email,
          department: reqObj.department,
          items: reqObj.items
        })
      });
    } catch (error) {
      // Revert optimistic update on error
      setRequests(prev => 
        prev.map(req => 
          req.id === id ? { ...req, status: 'PENDING' } : req
        )
      );
      console.error('Failed to update request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBellClick = () => {
    if (lowStockItems.length > 0) {
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleSnackbarClick = () => {
    setSnackbarOpen(false);
    router.push('/admin/low-stock');
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.card} style={{ overflowX: "auto" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 className={styles.heading}>User Requests</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={fetchRequests}
              disabled={reqLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: reqLoading ? 'wait' : 'pointer',
                opacity: reqLoading ? 0.7 : 1,
                fontSize: '14px'
              }}
            >
              {reqLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center' }} aria-label="Low Stock Alerts">
              <Badge color="error" variant={lowStockItems.length > 0 ? "dot" : undefined} overlap="circular" anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <NotificationsIcon onClick={handleBellClick} style={{ fontSize: 28, color: lowStockItems.length > 0 ? '#dc2626' : '#64748b', cursor: lowStockItems.length > 0 ? 'pointer' : 'default' }} titleAccess={lowStockItems.length > 0 ? `${lowStockItems.length} item(s) low stock` : 'No low stock alerts'} />
              </Badge>
            </span>
          </div>
        </div>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            onClick={handleSnackbarClick}
            severity="warning"
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          >
            There are stock low
          </MuiAlert>
        </Snackbar>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Department</th>
              <th>Items</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reqLoading ? (
              <tr>
                <td colSpan={5}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
                    <DotLoader
                      frames={loaderFrames}
                      className="gap-0.5"
                      dotClassName="dot-loader-dot"
                    />
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5}>No requests.</td></tr>
            ) : (
              (() => {
                // Sort all requests by id descending (latest first)
                const sortedRequests = [...requests].sort((a, b) => b.id - a.id);
                // Filter out requests with missing email, department, or items
                const validRequests = sortedRequests.filter(
                  req => req.email && req.email !== 'N/A' && req.department && Array.isArray(req.items) && req.items.length > 0
                );
                // Find valid pending requests
                const pendingRequests = validRequests.filter(r => r.status === "PENDING");
                let displayRequests: Request[];
                if (pendingRequests.length > 0) {
                  displayRequests = pendingRequests;
                } else {
                  displayRequests = validRequests.slice(0, 5);
                }
                return displayRequests.map((req, idx) => (
                  <tr key={`${req.id}-${idx}`} className={idx % 2 === 0 ? styles.zebra : ""}>
                    <td>{req.email || 'N/A'}</td>
                    <td>{req.department}</td>
                    <td>
                      {req.items.map((item, i) => (
                        <div key={`${item.namaBarang}-${i}`} style={{
                          background: "#f3f4f6",
                          borderRadius: 8,
                          padding: "6px 10px",
                          marginBottom: 6,
                          fontWeight: 500,
                          fontSize: "0.98em",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span>{item.namaBarang}</span>
                          <span style={{ color: "#64748b", marginLeft: 8 }}>x{item.bilangan}</span>
                        </div>
                      ))}
                    </td>
                    <td>
                      <span
                        className={
                          req.status === "APPROVE"
                            ? styles.statusAccepted
                            : req.status === "PENDING"
                            ? styles.statusPending
                            : styles.statusRejected
                        }
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === "PENDING" && (
                        <>
                          <button
                            className={styles.acceptBtn}
                            onClick={() => handleRequestAction(req.id, "APPROVE")}
                            disabled={actionLoading === req.id}
                            style={{
                              opacity: actionLoading === req.id ? 0.7 : 1,
                              cursor: actionLoading === req.id ? 'wait' : 'pointer'
                            }}
                          >
                            {actionLoading === req.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRequestAction(req.id, "DECLINE")}
                            disabled={actionLoading === req.id}
                            style={{
                              opacity: actionLoading === req.id ? 0.7 : 1,
                              cursor: actionLoading === req.id ? 'wait' : 'pointer'
                            }}
                          >
                            {actionLoading === req.id ? 'Processing...' : 'Reject'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ));
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
