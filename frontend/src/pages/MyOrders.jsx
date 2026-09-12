import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./MyOrders.css";

function MyOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState("ALL");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState(null);

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

            if (err.response?.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load your orders."
            );
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                navigate("/login");
                return;
            }

            setCancellingId(orderId);
            setError("");

            await api.delete(`/buyer/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: "CANCELLED",
                        }
                        : order
                )
            );
        } catch (err) {
            console.error("Cancel order error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to cancel the order."
            );
        } finally {
            setCancellingId(null);
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
                return status || "Unknown";
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
                            <option value="ALL">All Orders</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="orders-error">
                            <span>⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* LOADING */}
                    {loading && (
                        <div className="orders-empty">
                            <div className="loading-icon">⏳</div>

                            <h3>Loading orders...</h3>

                            <p>
                                Please wait while we fetch your orders.
                            </p>
                        </div>
                    )}

                    {/* NO ORDERS */}
                    {!loading &&
                        !error &&
                        filteredOrders.length === 0 && (
                            <div className="orders-empty">

                                <div className="empty-icon">
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
                        filteredOrders.length > 0 && (
                            <div className="orders-list">

                                {/* TABLE HEADER */}
                                <div className="orders-list-header">
                                    <span>PRODUCT</span>
                                    <span>QUANTITY</span>
                                    <span>AMOUNT</span>
                                    <span>STATUS</span>
                                    <span>ACTION</span>
                                </div>

                                {filteredOrders.map((order) => (

                                    <div
                                        className="order-item"
                                        key={order.id}
                                    >

                                        {/* PRODUCT */}
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

                                                <small>
                                                    {formatDate(order.created_at)}
                                                </small>
                                            </div>

                                        </div>

                                        {/* QUANTITY */}
                                        <div className="order-detail">

                                            <span>Quantity</span>

                                            <strong>
                                                {Number(order.quantity).toLocaleString("en-IN")} units
                                            </strong>

                                        </div>

                                        {/* AMOUNT */}
                                        <div className="order-detail">

                                            <span>Total Amount</span>

                                            <strong className="order-price">
                                                ₹
                                                {Number(
                                                    order.total_price || 0
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
                                                {order.status === "PENDING"
                                                    ? "Awaiting confirmation"
                                                    : order.status === "PROCESSING"
                                                        ? "Being prepared"
                                                        : order.status === "SHIPPED"
                                                            ? "On the way"
                                                            : order.status === "DELIVERED"
                                                                ? "Successfully delivered"
                                                                : order.status === "CANCELLED"
                                                                    ? "Order cancelled"
                                                                    : "Order updated"}
                                            </small>

                                        </div>

                                        {/* ACTIONS */}
                                        <div className="order-actions">

                                            <Link
                                                to={`/order/${order.id}`}
                                                className="view-order-btn"
                                            >
                                                View
                                            </Link>

                                            {order.status === "PENDING" && (
                                                <button
                                                    className="cancel-order-btn"
                                                    onClick={() =>
                                                        cancelOrder(order.id)
                                                    }
                                                    disabled={
                                                        cancellingId === order.id
                                                    }
                                                >
                                                    {cancellingId === order.id
                                                        ? "Cancelling..."
                                                        : "Cancel"}
                                                </button>
                                            )}

                                        </div>

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