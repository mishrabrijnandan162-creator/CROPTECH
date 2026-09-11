import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderDetails.css";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login to view order details.");
        return;
      }

      const response = await api.get(`/buyer/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrder(response.data.order);
    } catch (err) {
      console.error("Order details error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load order details."
      );
    } finally {
      setLoading(false);
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

  const formatDateTime = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return "⏳";

      case "CONFIRMED":
        return "✓";

      case "PROCESSING":
        return "⚙️";

      case "SHIPPED":
        return "🚚";

      case "DELIVERED":
        return "📦";

      case "CANCELLED":
        return "✕";

      default:
        return "📋";
    }
  };

  const getTimeline = (status) => {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ];

    const currentIndex = statuses.indexOf(status);

    return [
      {
        title: "Order Placed",
        description:
          "Your order has been successfully placed.",
        completed: currentIndex >= 0,
      },
      {
        title: "Farmer Confirmed",
        description:
          "Farmer has accepted your order.",
        completed: currentIndex >= 1,
      },
      {
        title: "Processing",
        description:
          "Your crop is being prepared for dispatch.",
        completed: currentIndex >= 2,
      },
      {
        title: "Shipped",
        description:
          "Your crop is on the way.",
        completed: currentIndex >= 3,
      },
      {
        title: "Delivered",
        description:
          "Your order has been delivered.",
        completed: currentIndex >= 4,
      },
    ];
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="orders-empty">
            <h2>Loading Order...</h2>
            <p>
              Please wait while we fetch your order details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">

          <Link
            to="/my-orders"
            className="back-link"
          >
            ← Back to My Orders
          </Link>

          <div className="orders-empty">
            <h2>Order Not Found</h2>

            <p>
              {error ||
                "Unable to find this order."}
            </p>

            <Link to="/my-orders">
              Go to My Orders
            </Link>
          </div>

        </div>
      </div>
    );
  }

  const timeline = getTimeline(order.status);

  return (
    <div className="order-details-page">

      <div className="order-details-container">

        {/* BACK */}
        <Link
          to="/my-orders"
          className="back-link"
        >
          ← Back to My Orders
        </Link>

        {/* HEADER */}
        <div className="order-top-card">

          <div>

            <p className="order-label">
              ORDER DETAILS
            </p>

            <h1>
              Order #CT-{order.id}
            </h1>

            <p>
              Placed on{" "}
              {formatDateTime(order.created_at)}
            </p>

          </div>

          <span className="current-status">
            {getStatusIcon(order.status)}{" "}
            {getStatusText(order.status)}
          </span>

        </div>

        {/* PRODUCT */}
        <div className="order-product-card">

          <div className="large-order-emoji">
            🌾
          </div>

          <div className="order-product-info">

            <h2>
              {order.crop_name}
            </h2>

            <p>
              Crop purchased through CROP TECH
            </p>

            <div className="order-meta">

              <div>
                <span>Quantity</span>

                <strong>
                  {order.quantity}{" "}
                  {order.unit || "units"}
                </strong>
              </div>

              <div>
                <span>Price / Unit</span>

                <strong>
                  ₹
                  {order.quantity
                    ? (
                        Number(order.total_price) /
                        Number(order.quantity)
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })
                    : "0"}
                </strong>
              </div>

              <div>
                <span>Total Amount</span>

                <strong>
                  ₹
                  {Number(
                    order.total_price
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* TRACKING */}
        <div className="tracking-card">

          <div className="tracking-header">

            <div>
              <h2>
                Order Tracking
              </h2>

              <p>
                Follow your crop from farm to your doorstep.
              </p>
            </div>

            <span className="delivery-date">
              Status: {getStatusText(order.status)}
            </span>

          </div>

          <div className="timeline">

            {timeline.map((step, index) => (

              <div
                className={`timeline-item ${
                  step.completed
                    ? "completed"
                    : ""
                }`}
                key={index}
              >

                <div className="timeline-marker">
                  {step.completed
                    ? "✓"
                    : index + 1}
                </div>

                <div className="timeline-content">

                  <h3>
                    {step.title}
                  </h3>

                  <p>
                    {step.description}
                  </p>

                  {index === 0 && (
                    <span>
                      {formatDateTime(
                        order.created_at
                      )}
                    </span>
                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* DELIVERY */}
        <div className="delivery-card">

          <div className="delivery-icon">
            📍
          </div>

          <div>

            <span>
              ORDER LOCATION
            </span>

            <h3>
              Farm-to-Market Delivery
            </h3>

            <p>
              Delivery and logistics information
              will be updated as the order progresses.
            </p>

          </div>

        </div>

        {/* AI */}
        <div className="order-ai-card">

          <div className="order-ai-icon">
            🤖
          </div>

          <div>

            <h3>
              CROP TECH AI
            </h3>

            <p>
              Your order is being monitored through
              the CROP TECH farm-to-market tracking
              system. AI-powered logistics and
              delivery optimization will be integrated
              in the next module.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default OrderDetails;