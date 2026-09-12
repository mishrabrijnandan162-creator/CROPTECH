import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_users: 0,
    farmers: 0,
    fpos: 0,
    buyers: 0,
    products: 0,
    orders: 0,
    total_sales: 0,
    pending_fpo: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      navigate("/");
      return;
    }

    fetchDashboard(token);
  }, [navigate]);

  const fetchDashboard = async (token) => {
    try {
      const response = await api.get("/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(response.data.stats || {});
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* HEADER */}
      <div className="admin-header">
        <div>
          <p className="admin-small-title">CROP TECH</p>
          <h1>Admin Dashboard</h1>
          <p>Manage and monitor the entire CROP TECH platform.</p>
        </div>

        <div className="admin-badge">
          🛡️ Administrator
        </div>
      </div>

      {error && (
        <div className="admin-error">
          ⚠️ {error}
        </div>
      )}

      {/* STATS */}
      <div className="admin-stats">

        <div className="admin-stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <span>Total Users</span>
            <h2>{stats.total_users}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">🌾</div>
          <div>
            <span>Farmers</span>
            <h2>{stats.farmers}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">🏢</div>
          <div>
            <span>FPOs</span>
            <h2>{stats.fpos}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">🛒</div>
          <div>
            <span>Buyers</span>
            <h2>{stats.buyers}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">📦</div>
          <div>
            <span>Products</span>
            <h2>{stats.products}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">📋</div>
          <div>
            <span>Total Orders</span>
            <h2>{stats.orders}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">💰</div>
          <div>
            <span>Total Sales</span>
            <h2>₹{Number(stats.total_sales || 0).toLocaleString()}</h2>
          </div>
        </div>

        <div className="admin-stat-card pending-card">
          <div className="stat-icon">⏳</div>
          <div>
            <span>Pending FPO</span>
            <h2>{stats.pending_fpo}</h2>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Quick Management</h2>
            <p>Manage important platform activities.</p>
          </div>
        </div>

        <div className="admin-actions">

          <button onClick={() => navigate("/admin/users")}>
            <span>👥</span>
            <div>
              <strong>User Management</strong>
              <small>Manage farmers, FPOs and buyers</small>
            </div>
          </button>

          <button onClick={() => navigate("/admin/fpo-verification")}>
            <span>🏢</span>
            <div>
              <strong>FPO Verification</strong>
              <small>Approve or reject FPO applications</small>
            </div>
          </button>

          <button onClick={() => navigate("/admin/products")}>
            <span>🌾</span>
            <div>
              <strong>Product Management</strong>
              <small>Monitor marketplace listings</small>
            </div>
          </button>

          <button onClick={() => navigate("/admin/orders")}>
            <span>📦</span>
            <div>
              <strong>Order Management</strong>
              <small>Monitor all platform orders</small>
            </div>
          </button>

        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Platform Overview</h2>
            <p>Current CROP TECH platform status.</p>
          </div>
        </div>

        <div className="overview-grid">

          <div className="overview-card">
            <span>👨‍🌾</span>
            <div>
              <strong>Farmers</strong>
              <p>{stats.farmers} registered farmers</p>
            </div>
          </div>

          <div className="overview-card">
            <span>🏢</span>
            <div>
              <strong>FPOs</strong>
              <p>{stats.fpos} registered FPOs</p>
            </div>
          </div>

          <div className="overview-card">
            <span>🛍️</span>
            <div>
              <strong>Marketplace</strong>
              <p>{stats.products} crop listings</p>
            </div>
          </div>

          <div className="overview-card">
            <span>🚚</span>
            <div>
              <strong>Orders</strong>
              <p>{stats.orders} total orders</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default AdminDashboard;