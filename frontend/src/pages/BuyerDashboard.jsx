import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./BuyerDashboard.css";

function BuyerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await api.get("/buyer/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Buyer Dashboard Error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load buyer dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const buyerName = user.name || "Buyer";

  // ================= STATS =================

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const totalSpent = orders.reduce(
    (total, order) =>
      total + Number(order.total_price || 0),
    0
  );

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="buyer-dashboard">
        <div className="buyer-loading">
          <h2>Loading Dashboard...</h2>
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  // ================= ERROR =================

  if (error) {
    return (
      <div className="buyer-dashboard">
        <div className="buyer-error">
          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button onClick={fetchOrders}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-dashboard">

      {/* ================= HEADER ================= */}

      <div className="buyer-header">

        <div>
          <p className="buyer-label">
            BUYER DASHBOARD
          </p>

          <h1>
            Welcome, {buyerName} 👋
          </h1>

          <p>
            Manage your purchases and discover fresh
            crops directly from farmers.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="shop-btn"
        >
          🛒 Browse Marketplace
        </Link>

      </div>


      {/* ================= STATS ================= */}

      <div className="buyer-stats-grid">

        {/* Total Orders */}

        <div className="buyer-stat-card">

          <div className="buyer-stat-icon">
            📦
          </div>

          <div>
            <span>Total Orders</span>

            <h2>
              {totalOrders}
            </h2>
          </div>

        </div>


        {/* Pending */}

        <div className="buyer-stat-card">

          <div className="buyer-stat-icon">
            ⏳
          </div>

          <div>
            <span>Pending Orders</span>

            <h2>
              {pendingOrders}
            </h2>
          </div>

        </div>


        {/* Completed */}

        <div className="buyer-stat-card">

          <div className="buyer-stat-icon">
            ✅
          </div>

          <div>
            <span>Completed Orders</span>

            <h2>
              {completedOrders}
            </h2>
          </div>

        </div>


        {/* Total Spending */}

        <div className="buyer-stat-card">

          <div className="buyer-stat-icon">
            💰
          </div>

          <div>
            <span>Total Spending</span>

            <h2>
              ₹{totalSpent.toLocaleString()}
            </h2>
          </div>

        </div>

      </div>


      {/* ================= MAIN CONTENT ================= */}

      <div className="buyer-main-content">

        {/* ================= RECENT ORDERS ================= */}

        <div className="recent-orders-section">

          <div className="section-header">

            <div>
              <h2>
                Recent Orders
              </h2>

              <p>
                Track your latest crop purchases.
              </p>
            </div>

            <Link
              to="/my-orders"
              className="view-all-btn"
            >
              View All →
            </Link>

          </div>


          {orders.length === 0 ? (

            <div className="no-orders">

              <div className="empty-icon">
                📦
              </div>

              <h3>
                No orders yet
              </h3>

              <p>
                Start shopping for fresh crops
                directly from farmers.
              </p>

              <Link
                to="/marketplace"
                className="shop-now-btn"
              >
                Explore Marketplace
              </Link>

            </div>

          ) : (

            <div className="orders-list">

              {orders.slice(0, 5).map((order) => (

                <div
                  className="buyer-order-card"
                  key={order.id}
                >

                  <div className="order-crop">

                    <div className="order-crop-icon">
                      🌾
                    </div>

                    <div>
                      <h3>
                        Product #{order.product_id}
                      </h3>

                      <p>
                        Order #CT-{order.id}
                      </p>
                    </div>

                  </div>


                  <div className="order-info">

                    <span>
                      Quantity
                    </span>

                    <strong>
                      {Number(order.quantity || 0)}
                    </strong>

                  </div>


                  <div className="order-info">

                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {Number(
                        order.total_price || 0
                      ).toLocaleString()}
                    </strong>

                  </div>


                  <div className="order-status">

                    <span
                      className={`status ${order.status?.toLowerCase()}`}
                    >
                      {order.status}
                    </span>

                  </div>


                  <Link
                    to={`/order/${order.id}`}
                    className="order-view-btn"
                  >
                    View Order →
                  </Link>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ================= RIGHT SIDE ================= */}

        <div className="buyer-side">

          {/* Marketplace Card */}

          <div className="marketplace-card">

            <div className="marketplace-icon">
              🌾
            </div>

            <h3>
              Fresh Crops
            </h3>

            <p>
              Buy directly from farmers and
              get quality agricultural products
              at transparent prices.
            </p>

            <Link
              to="/marketplace"
              className="marketplace-card-btn"
            >
              Explore Crops →
            </Link>

          </div>


          {/* Quick Actions */}

          <div className="buyer-quick-actions">

            <h3>
              Quick Actions
            </h3>

            <Link
              to="/marketplace"
              className="buyer-action-link"
            >
              🛒 Browse Marketplace
            </Link>

            <Link
              to="/my-orders"
              className="buyer-action-link"
            >
              📦 My Orders
            </Link>

            <button
              onClick={() =>
                alert(
                  "Wishlist will be available soon!"
                )
              }
            >
              ❤️ Wishlist
            </button>

            <button
              onClick={() =>
                alert(
                  "Profile editing will be available soon!"
                )
              }
            >
              👤 My Profile
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default BuyerDashboard;