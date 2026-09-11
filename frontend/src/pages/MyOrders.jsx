import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");

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
        setError("Please login as a buyer to view your orders.");
        return;
      }

      const response = await api.get("/buyer/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Orders error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "DELIVERED":
        return "delivered";

      case "SHIPPED":
      case "PROCESSING":
        return "transit";

      case "CONFIRMED":
        return "confirmed";

      case "CANCELLED":
        return "cancelled";

      default:
        return "pending";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "DELIVERED":
        return "Delivered";

      case "SHIPPED":
        return "Shipped";

      case "PROCESSING":
        return "Processing";

      case "CONFIRMED":
        return "Confirmed";

      case "CANCELLED":
        return "Cancelled";

      case "PENDING":
        return "Pending";

      default:
        return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const transitOrders = orders.filter(
    (order) =>
      order.status === "PROCESSING" ||
      order.status === "SHIPPED"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  return (
    <div className="orders-page">

      <div className="orders-container">

        {/* HEADER */}
        <div className="orders-header">

          <div>
            <p className="orders-label">
              BUYER DASHBOARD
            </p>

            <h1>My Orders</h1>

            <p>
              Track and manage all your crop orders in one place.
            </p>
          </div>

          <Link
            to="/marketplace"
            className="browse-market-btn"
          >
            Browse Marketplace →
          </Link>

        </div>

        {/* STATS */}
        <div className="order-stats">

          <div className="order-stat">
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
          </div>

          <div className="order-stat">
            <span>Pending</span>
            <strong>{pendingOrders}</strong>
          </div>

          <div className="order-stat">
            <span>In Transit</span>
            <strong>{transitOrders}</strong>
          </div>

          <div className="order-stat">
            <span>Delivered</span>
            <strong>{deliveredOrders}</strong>
          </div>

        </div>

        {/* ORDERS CARD */}
        <div className="orders-card">

          <div className="orders-card-header">

            <div>
              <h2>Recent Orders</h2>

              <p>
                Your latest crop purchases
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">
                All Orders
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="PROCESSING">
                Processing
              </option>

              <option value="SHIPPED">
                Shipped
              </option>

              <option value="DELIVERED">
                Delivered
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="orders-empty">
              <h3>Loading orders...</h3>
              <p>Please wait while we fetch your orders.</p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="orders-empty">
              <h3>Unable to load orders</h3>
              <p>{error}</p>

              <button
                onClick={fetchOrders}
                className="view-order-btn"
              >
                Try Again
              </button>
            </div>
          )}

          {/* NO ORDERS */}
          {!loading &&
            !error &&
            filteredOrders.length === 0 && (
              <div className="orders-empty">

                <div style={{ fontSize: "50px" }}>
                  📦
                </div>

                <h3>
                  {orders.length === 0
                    ? "No Orders Yet"
                    : "No Orders Found"}
                </h3>

                <p>
                  {orders.length === 0
                    ? "Start shopping from the marketplace to place your first order."
                    : "No orders match the selected filter."}
                </p>

                {orders.length === 0 && (
                  <Link
                    to="/marketplace"
                    className="browse-market-btn"
                  >
                    Browse Marketplace →
                  </Link>
                )}

              </div>
            )}

          {/* ORDERS */}
          {!loading &&
            !error &&
            filteredOrders.length > 0 && (

              <div className="orders-list">

                {filteredOrders.map((order) => (

                  <div
                    className="order-item"
                    key={order.id}
                  >

                    {/* CROP */}
                    <div className="order-product">

                      <div className="order-emoji">
                        🌾
                      </div>

                      <div>

                        <h3>
                          Product #{order.product_id}
                        </h3>

                        <span>
                          Order #CT-{order.id}
                        </span>

                      </div>

                    </div>

                    {/* QUANTITY */}
                    <div className="order-detail">

                      <span>Quantity</span>

                      <strong>
                        {order.quantity} units
                      </strong>

                    </div>

                    {/* AMOUNT */}
                    <div className="order-detail">

                      <span>Total</span>

                      <strong>
                        ₹
                        {Number(
                          order.total_price
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>

                    {/* STATUS */}
                    <div className="order-status">

                      <span
                        className={`status-badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>

                      <small>
                        {formatDate(order.created_at)}
                      </small>

                    </div>

                    {/* VIEW */}
                    <Link
                      to={`/order/${order.id}`}
                      className="view-order-btn"
                    >
                      View
                    </Link>

                  </div>

                ))}

              </div>
            )}

        </div>

        {/* DELIVERY INFO */}
        <div className="delivery-info">

          <div className="delivery-icon">
            🚚
          </div>

          <div>

            <h3>
              Track Your Farm-to-Market Journey
            </h3>

            <p>
              CROP TECH provides transparent order
              tracking from farmer confirmation to
              final delivery.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default MyOrders;