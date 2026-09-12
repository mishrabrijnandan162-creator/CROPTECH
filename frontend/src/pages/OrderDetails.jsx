import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./OrderDetails.css";

function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);

    // ---------------------------------------------------------
    // GET USER ROLE
    // ---------------------------------------------------------

    const getUserRole = () => {
        try {
            const user = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (user?.role) {
                return user.role.toUpperCase();
            }
        } catch (err) {
            console.error("User data error:", err);
        }

        // Fallback: read role from JWT
        try {
            const token = localStorage.getItem("access_token");

            if (!token) return null;

            const payload = JSON.parse(
                atob(token.split(".")[1])
            );

            return payload?.role?.toUpperCase() || null;
        } catch (err) {
            console.error("Token decode error:", err);
            return null;
        }
    };

    // ---------------------------------------------------------
    // FETCH ORDER
    // ---------------------------------------------------------

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("access_token");

            if (!token) {
                navigate("/login");
                return;
            }

            const role = getUserRole();

            let endpoint = "";

            if (role === "FARMER" || role === "FPO") {
                endpoint = `/seller/orders/${id}`;
            } else {
                endpoint = `/buyer/orders/${id}`;
            }

            console.log("Order details endpoint:", endpoint);

            const response = await api.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setOrder(response.data.order);
        } catch (err) {
            console.error("Order details error:", err);
            console.error("Server response:", err.response?.data);

            if (err.response?.status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load order details."
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // STATUS HELPERS
    // ---------------------------------------------------------

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
                return status || "Unknown";
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "CONFIRMED":
                return "confirmed";

            case "PROCESSING":
                return "processing";

            case "SHIPPED":
                return "shipped";

            case "DELIVERED":
                return "delivered";

            case "CANCELLED":
                return "cancelled";

            default:
                return "pending";
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

    // ---------------------------------------------------------
    // NEXT SELLER ACTION
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // UPDATE SELLER ORDER STATUS
    // ---------------------------------------------------------

    const updateOrderStatus = async (newStatus) => {
        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                navigate("/login");
                return;
            }

            setUpdating(true);
            setError("");

            const response = await api.put(
                `/seller/orders/${id}/status`,
                {
                    status: newStatus,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Order status update:",
                response.data
            );

            setOrder((previousOrder) => ({
                ...previousOrder,
                status:
                    response.data.order?.status ||
                    newStatus,
            }));

            alert(
                `Order #CT-${id} updated to ${getStatusText(
                    response.data.order?.status || newStatus
                )}`
            );
        } catch (err) {
            console.error(
                "Order status update error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update order status."
            );
        } finally {
            setUpdating(false);
        }
    };

    // ---------------------------------------------------------
    // DATE FORMAT
    // ---------------------------------------------------------

    const formatDateTime = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    // ---------------------------------------------------------
    // TIMELINE
    // ---------------------------------------------------------

    const getTimeline = (status) => {
        const statuses = [
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
        ];

        const currentIndex = statuses.indexOf(status);

        if (status === "CANCELLED") {
            return [
                {
                    title: "Order Placed",
                    description:
                        "The order was successfully placed.",
                    completed: true,
                },
                {
                    title: "Order Cancelled",
                    description:
                        "This order has been cancelled.",
                    completed: true,
                    cancelled: true,
                },
            ];
        }

        return [
            {
                title: "Order Placed",
                description:
                    "The buyer successfully placed the order.",
                completed: currentIndex >= 0,
            },
            {
                title: "Farmer Confirmed",
                description:
                    "The farmer/FPO accepted the order.",
                completed: currentIndex >= 1,
            },
            {
                title: "Processing",
                description:
                    "The crop is being prepared for dispatch.",
                completed: currentIndex >= 2,
            },
            {
                title: "Shipped",
                description:
                    "The crop has been dispatched.",
                completed: currentIndex >= 3,
            },
            {
                title: "Delivered",
                description:
                    "The order has been delivered.",
                completed: currentIndex >= 4,
            },
        ];
    };

    // ---------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------

    if (loading) {
        return (
            <div className="order-details-page">
                <div className="order-details-container">
                    <div className="orders-empty">
                        <div className="loading-icon">⏳</div>

                        <h2>Loading Order...</h2>

                        <p>
                            Please wait while we fetch the order
                            details.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // ERROR
    // ---------------------------------------------------------

    if (error || !order) {
        return (
            <div className="order-details-page">
                <div className="order-details-container">

                    <Link
                        to={
                            getUserRole() === "FARMER" ||
                                getUserRole() === "FPO"
                                ? "/seller-orders"
                                : "/my-orders"
                        }
                        className="back-link"
                    >
                        ← Back to Orders
                    </Link>

                    <div className="orders-empty">
                        <div className="loading-icon">⚠️</div>

                        <h2>Order Not Found</h2>

                        <p>
                            {error ||
                                "Unable to find this order."}
                        </p>

                        <Link
                            to={
                                getUserRole() === "FARMER" ||
                                    getUserRole() === "FPO"
                                    ? "/seller-orders"
                                    : "/my-orders"
                            }
                            className="primary-order-link"
                        >
                            Go to Orders
                        </Link>
                    </div>

                </div>
            </div>
        );
    }

    const role = getUserRole();

    const isSeller =
        role === "FARMER" ||
        role === "FPO";

    const timeline = getTimeline(order.status);

    const nextAction = isSeller
        ? getNextAction(order.status)
        : null;

    const unitPrice =
        Number(order.quantity) > 0
            ? Number(order.total_price) /
            Number(order.quantity)
            : 0;

    // ---------------------------------------------------------
    // MAIN UI
    // ---------------------------------------------------------

    return (
        <div className="order-details-page">

            <div className="order-details-container">

                {/* BACK */}

                <Link
                    to={
                        isSeller
                            ? "/seller-orders"
                            : "/my-orders"
                    }
                    className="back-link"
                >
                    ← Back to Orders
                </Link>

                {/* HEADER */}

                <div className="order-top-card">

                    <div>

                        <p className="order-label">
                            {isSeller
                                ? "SELLER ORDER DETAILS"
                                : "ORDER DETAILS"}
                        </p>

                        <h1>
                            Order #CT-{order.id}
                        </h1>

                        <p>
                            Placed on{" "}
                            {formatDateTime(
                                order.created_at
                            )}
                        </p>

                    </div>

                    <span
                        className={`current-status ${getStatusClass(
                            order.status
                        )}`}
                    >
                        {getStatusIcon(order.status)}{" "}
                        {getStatusText(order.status)}
                    </span>

                </div>

                {/* ERROR FROM STATUS UPDATE */}

                {error && (
                    <div className="order-error">
                        <strong>
                            Could not update order
                        </strong>

                        <p>{error}</p>
                    </div>
                )}

                {/* PRODUCT */}

                <div className="order-product-card">

                    <div className="large-order-emoji">
                        🌾
                    </div>

                    <div className="order-product-info">

                        <span className="section-label">
                            CROP
                        </span>

                        <h2>
                            {order.crop_name ||
                                `Product #${order.product_id}`}
                        </h2>

                        <p>
                            Agricultural produce listed on
                            CROP TECH
                        </p>

                        <div className="order-meta">

                            <div>
                                <span>Quantity</span>

                                <strong>
                                    {Number(
                                        order.quantity
                                    ).toLocaleString("en-IN")}{" "}
                                    {order.unit || "units"}
                                </strong>
                            </div>

                            <div>
                                <span>Price / Unit</span>

                                <strong>
                                    ₹
                                    {unitPrice.toLocaleString(
                                        "en-IN",
                                        {
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Total Amount</span>

                                <strong className="total-price">
                                    ₹
                                    {Number(
                                        order.total_price || 0
                                    ).toLocaleString("en-IN")}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

                {/* SELLER INFORMATION */}

                {isSeller && (
                    <div className="order-info-grid">

                        <div className="order-info-box">

                            <span>BUYER</span>

                            <strong>
                                Buyer #{order.buyer_id}
                            </strong>

                        </div>

                        <div className="order-info-box">

                            <span>PRODUCT ID</span>

                            <strong>
                                #{order.product_id}
                            </strong>

                        </div>

                        <div className="order-info-box">

                            <span>ORDER STATUS</span>

                            <strong>
                                {getStatusText(order.status)}
                            </strong>

                        </div>

                    </div>
                )}

                {/* TRACKING */}

                <div className="tracking-card">

                    <div className="tracking-header">

                        <div>

                            <h2>
                                Order Tracking
                            </h2>

                            <p>
                                {isSeller
                                    ? "Manage the order as it moves from confirmation to delivery."
                                    : "Follow your crop from farm to your doorstep."}
                            </p>

                        </div>

                        <span className="delivery-date">
                            {getStatusText(order.status)}
                        </span>

                    </div>

                    <div className="timeline">

                        {timeline.map(
                            (step, index) => (

                                <div
                                    className={`timeline-item ${step.completed
                                            ? "completed"
                                            : ""
                                        } ${step.cancelled
                                            ? "timeline-cancelled"
                                            : ""
                                        }`}
                                    key={index}
                                >

                                    <div className="timeline-marker">
                                        {step.completed
                                            ? step.cancelled
                                                ? "✕"
                                                : "✓"
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
                            )
                        )}

                    </div>

                </div>

                {/* SELLER ACTION */}

                {isSeller && nextAction && (
                    <div className="seller-action-card">

                        <div>

                            <span className="section-label">
                                NEXT ACTION
                            </span>

                            <h2>
                                {nextAction.text}
                            </h2>

                            <p>
                                Update this order to{" "}
                                <strong>
                                    {getStatusText(
                                        nextAction.status
                                    )}
                                </strong>
                                .
                            </p>

                        </div>

                        <button
                            className="order-action-btn"
                            disabled={updating}
                            onClick={() =>
                                updateOrderStatus(
                                    nextAction.status
                                )
                            }
                        >
                            {updating
                                ? "Updating..."
                                : nextAction.text}
                        </button>

                    </div>
                )}

                {/* DELIVERY */}

                <div className="delivery-card">

                    <div className="delivery-icon">
                        📍
                    </div>

                    <div>

                        <span>
                            FARM-TO-MARKET DELIVERY
                        </span>

                        <h3>
                            {isSeller
                                ? "Delivery Information"
                                : "Farm-to-Market Delivery"}
                        </h3>

                        <p>
                            {isSeller
                                ? "Shipment and delivery information will be updated as the order progresses."
                                : "Delivery and logistics information will be updated as the order progresses."}
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
                            AI-powered demand forecasting,
                            price intelligence and logistics
                            optimisation are part of the CROP
                            TECH intelligent marketplace
                            ecosystem.
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default OrderDetails;