import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./FpoDashboard.css";

function FpoDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.get("/fpo/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err) {
      console.error("FPO dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load FPO dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fpo-loading">
        <div className="loading-spinner"></div>
        <p>Loading FPO Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fpo-error-page">
        <div className="fpo-error-box">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const fpo = data?.fpo;
  const stats = data?.stats;
  const products = data?.products || [];

  return (
    <div className="fpo-dashboard">

      {/* ================= HEADER ================= */}

      <div className="fpo-header">
        <div>
          <p className="fpo-label">FPO MANAGEMENT</p>

          <h1>Welcome, {fpo?.name || "FPO"} 👋</h1>

          <p className="fpo-location">
            📍 {fpo?.district || "Location"},{" "}
            {fpo?.state || ""}
          </p>
        </div>

        <div className="verification-badge">
          <span className="status-dot"></span>
          {fpo?.verification_status || "PENDING"}
        </div>
      </div>

      {/* ================= STATS ================= */}

      <div className="fpo-stats">

        <div className="fpo-stat-card">
          <div className="stat-icon">🌾</div>

          <div>
            <p>Total Products</p>
            <h2>{stats?.total_products || 0}</h2>
          </div>
        </div>

        <div className="fpo-stat-card">
          <div className="stat-icon">📦</div>

          <div>
            <p>Available Products</p>
            <h2>{stats?.available_products || 0}</h2>
          </div>
        </div>

        <div className="fpo-stat-card">
          <div className="stat-icon">🛒</div>

          <div>
            <p>Total Orders</p>
            <h2>{stats?.total_orders || 0}</h2>
          </div>
        </div>

        <div className="fpo-stat-card">
          <div className="stat-icon">💰</div>

          <div>
            <p>Total Sales</p>
            <h2>
              ₹{Number(stats?.total_sales || 0).toLocaleString()}
            </h2>
          </div>
        </div>

      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <div className="fpo-actions-section">

        <div>
          <h2>Quick Actions</h2>
          <p>Manage your FPO activities</p>
        </div>

        <div className="fpo-actions">

          <button
            className="action-primary"
            onClick={() => navigate("/add-crop")}
          >
            <span>＋</span>
            Add Crop
          </button>

          <button
            className="action-secondary"
            onClick={() => navigate("/seller-orders")}
          >
            <span>📋</span>
            View Orders
          </button>

          <button
            className="action-secondary"
            onClick={() => navigate("/marketplace")}
          >
            <span>🛒</span>
            Marketplace
          </button>

        </div>
      </div>

      {/* ================= PRODUCTS ================= */}

      <div className="fpo-products-section">

        <div className="section-heading">
          <div>
            <h2>My Products</h2>
            <p>Crops listed by your FPO</p>
          </div>

          <button
            onClick={() => navigate("/add-crop")}
            className="view-all-btn"
          >
            + Add Crop
          </button>
        </div>

        {products.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">🌱</div>

            <h3>No products yet</h3>

            <p>
              Start adding crops to your marketplace.
            </p>

            <button
              onClick={() => navigate("/add-crop")}
            >
              Add Your First Crop
            </button>
          </div>
        ) : (
          <div className="products-table-wrapper">

            <table className="fpo-products-table">

              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Quality</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>

                    <td>
                      <div className="crop-name">
                        🌾 {product.crop_name}
                      </div>
                    </td>

                    <td>
                      {product.quantity} {product.unit}
                    </td>

                    <td>
                      <span className="quality-badge">
                        {product.quality_grade || "N/A"}
                      </span>
                    </td>

                    <td>
                      <strong>
                        ₹{product.expected_price}
                      </strong>
                    </td>

                    <td>
                      {product.location || "N/A"}
                    </td>

                    <td>
                      <span
                        className={
                          product.is_available
                            ? "available-badge"
                            : "unavailable-badge"
                        }
                      >
                        {product.is_available
                          ? "Available"
                          : "Unavailable"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="edit-product-btn"
                        onClick={() =>
                          navigate(`/edit-crop/${product.id}`)
                        }
                      >
                        Edit
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ================= ORDER SUMMARY ================= */}

      <div className="fpo-order-summary">

        <div>
          <h2>Order Overview</h2>
          <p>Current orders received for your products</p>
        </div>

        <div className="order-mini-stats">

          <div>
            <span>Pending</span>
            <strong>{stats?.pending_orders || 0}</strong>
          </div>

          <div>
            <span>Confirmed</span>
            <strong>{stats?.confirmed_orders || 0}</strong>
          </div>

          <div>
            <span>Delivered</span>
            <strong>{stats?.delivered_orders || 0}</strong>
          </div>

        </div>

      </div>

    </div>
  );
}

export default FpoDashboard;