import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./SellerOrders.css";

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login as a farmer.");
        return;
      }

      const response = await api.get("/seller/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Seller orders error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("access_token");

      setUpdatingId(orderId);
      setError("");

      await api.put(
        `/seller/orders/${orderId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI immediately
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      alert(
        `Order #CT-${orderId} updated to ${getStatusText(
          newStatus
        )}`
      );
    } catch (err) {
      console.error("Status update error:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case "PENDING":
        return {
          text: "Confirm Order",
          status: "CONFIRMED",
        };

      case "CONFIRMED":
        return {
          text: "Start Processing",
          status: "PROCESSING",
        };

      case "PROCESSING":
        return {
          text: "Mark Shipped",
          status: "SHIPPED",
        };

      case "SHIPPED":
        return {
          text: "Mark Delivered",
          status: "DELIVERED",
        };

      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "DELIVERED":
        return "delivered";

      case "SHIPPED":
        return "shipped";

      case "PROCESSING":
        return "processing";

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
      case "PENDING":
        return "Pending";

      case "CONFIRMED":
        return "Confirmed";

      case "PROCESSING":
        return "Processing";

      case "SHIPPED":
        return "Shipped";

      case "DELIVERED":
        return "Delivered";

      case "CANCELLED":
        return "Cancelled";

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
      : orders.filter(
          (order) => order.status === filter
        );

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "CONFIRMED"
  ).length;

  const processingCount = orders.filter(
    (order) => order.status === "PROCESSING"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  return (
    <div className="seller-orders-page">

      <div className="seller-orders-container">

        {/* HEADER */}
        <div className="seller-orders-header">

          <div>
            <p className="seller-label">
              FARMER DASHBOARD
            </p>

            <h1>Customer Orders</h1>

            <p>
              Manage orders received for your crops.
            </p>
          </div>

          <Link
            to="/farmer-dashboard"
            className="back-dashboard-btn"
          >
            ← Dashboard
          </Link>

        </div>

        {/* STATS */}
        <div className="seller-order-stats">

          <div className="seller-stat">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="seller-stat">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <div className="seller-stat">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>

          <div className="seller-stat">
            <span>Processing</span>
            <strong>{processingCount}</strong>
          </div>

          <div className="seller-stat">
            <span>Delivered</span>
            <strong>{deliveredCount}</strong>
          </div>

        </div>

        {/* ORDERS CARD */}
        <div className="seller-orders-card">

          <div className="seller-orders-card-header">

            <div>
              <h2>Received Orders</h2>

              <p>
                Orders placed by buyers for your products
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
            >
              <option value="ALL">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="seller-orders-empty">
              <h3>Loading orders...</h3>
              <p>
                Fetching customer orders from the server.
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="seller-orders-empty">

              <h3>Unable to load orders</h3>

              <p>{error}</p>

              <button
                onClick={fetchOrders}
                className="retry-btn"
              >
                Try Again
              </button>

            </div>
          )}

          {/* NO ORDERS */}
          {!loading &&
            !error &&
            filteredOrders.length === 0 && (
              <div className="seller-orders-empty">

                <div className="empty-icon">
                  📦
                </div>

                <h3>
                  {orders.length === 0
                    ? "No Customer Orders Yet"
                    : "No Orders Found"}
                </h3>

                <p>
                  {orders.length === 0
                    ? "When buyers purchase your crops, their orders will appear here."
                    : "No orders match the selected filter."}
                </p>

              </div>
            )}

          {/* ORDERS */}
          {!loading &&
            !error &&
            filteredOrders.length > 0 && (

              <div className="seller-orders-list">

                {filteredOrders.map((order) => {

                  const nextAction =
                    getNextAction(order.status);

                  return (
                    <div
                      className="seller-order-item"
                      key={order.id}
                    >

                      {/* PRODUCT */}
                      <div className="seller-order-product">

                        <div className="seller-order-icon">
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

                      {/* BUYER */}
                      <div className="seller-order-detail">

                        <span>Buyer</span>

                        <strong>
                          Buyer #{order.buyer_id}
                        </strong>

                      </div>

                      {/* QUANTITY */}
                      <div className="seller-order-detail">

                        <span>Quantity</span>

                        <strong>
                          {order.quantity} units
                        </strong>

                      </div>

                      {/* TOTAL */}
                      <div className="seller-order-detail">

                        <span>Total</span>

                        <strong>
                          ₹
                          {Number(
                            order.total_price
                          ).toLocaleString("en-IN")}
                        </strong>

                      </div>

                      {/* STATUS + ACTION */}
                      <div className="seller-order-status">

                        <span
                          className={`seller-status-badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>

                        <small>
                          {formatDate(
                            order.created_at
                          )}
                        </small>

                        {nextAction && (
                          <button
                            className="status-action-btn"
                            disabled={
                              updatingId === order.id
                            }
                            onClick={() =>
                              updateOrderStatus(
                                order.id,
                                nextAction.status
                              )
                            }
                          >
                            {updatingId === order.id
                              ? "Updating..."
                              : nextAction.text}
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </div>

        {/* INFO */}
        <div className="seller-order-info">

          <div className="seller-info-icon">
            🌱
          </div>

          <div>

            <h3>
              Manage Your Farm Orders
            </h3>

            <p>
              Confirm orders, prepare crops, ship
              them and mark them delivered as the
              order progresses.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default SellerOrders;