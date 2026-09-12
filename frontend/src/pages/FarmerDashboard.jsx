import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./FarmerDashboard.css";

function FarmerDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("access_token");

            if (!token) {
                setError("Please login first.");
                return;
            }

            const response = await api.get("/farmers/dashboard", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setDashboard(response.data);
        } catch (err) {
            console.error("Dashboard error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load farmer dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    // Loading
    if (loading) {
        return (
            <div className="farmer-dashboard">
                <div style={{ textAlign: "center", padding: "60px" }}>
                    <h2>Loading Dashboard...</h2>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="farmer-dashboard">
                <div style={{ textAlign: "center", padding: "60px" }}>
                    <h2>Something went wrong</h2>
                    <p>{error}</p>

                    <button onClick={fetchDashboard}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const handleDelete = async (productId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this crop?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(productId);

            const token = localStorage.getItem("access_token");

            await api.delete(`/products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            alert("Crop removed from marketplace successfully! 🌾");

            fetchDashboard();

        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Failed to delete crop."
            );
        } finally {
            setDeletingId(null);
        }
    };

    const farmer = dashboard?.farmer;
    const stats = dashboard?.stats || {};
    const products = dashboard?.products || [];

    // User name
    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const farmerName =
        user.name ||
        farmer?.farm_name ||
        "Farmer";

    return (
        <div className="farmer-dashboard">

            {/* ================= HEADER ================= */}

            <div className="dashboard-header">

                <div>
                    <p className="dashboard-label">
                        FARMER DASHBOARD
                    </p>

                    <h1>
                        Welcome, {farmerName} 👋
                    </h1>

                    <p>
                        Manage your crops, orders and earnings from one place.
                    </p>
                </div>

                <Link
                    to="/marketplace"
                    className="marketplace-btn"
                >
                    View Marketplace →
                </Link>

            </div>


            {/* ================= STATS ================= */}

            <div className="stats-grid">

                {/* Total Listings */}

                <div className="stat-card">

                    <div className="stat-icon">
                        🌾
                    </div>

                    <div>
                        <span>
                            Total Listings
                        </span>

                        <h2>
                            {stats.total_products || 0}
                        </h2>
                    </div>

                </div>


                {/* Available Products */}

                <div className="stat-card">

                    <div className="stat-icon">
                        📦
                    </div>

                    <div>
                        <span>
                            Available Crops
                        </span>

                        <h2>
                            {stats.available_products || 0}
                        </h2>
                    </div>

                </div>


                {/* Total Quantity */}

                <div className="stat-card">

                    <div className="stat-icon">
                        🌱
                    </div>

                    <div>
                        <span>
                            Total Quantity
                        </span>

                        <h2>
                            {Number(stats.total_quantity || 0).toLocaleString()}
                        </h2>
                    </div>

                </div>


                {/* Profile */}

                <div className="stat-card">

                    <div className="stat-icon">
                        👨‍🌾
                    </div>

                    <div>
                        <span>
                            Farmer ID
                        </span>

                        <h2>
                            #{farmer?.id || "-"}
                        </h2>
                    </div>

                </div>

            </div>


            {/* ================= MAIN CONTENT ================= */}

            <div className="dashboard-content">


                {/* ================= MY CROPS ================= */}

                <div className="crops-section">

                    <div className="section-header">

                        <div>
                            <h2>
                                My Crop Listings
                            </h2>

                            <p>
                                Manage your crops available in the marketplace.
                            </p>
                        </div>

                        <Link
                            to="/add-crop"
                            className="add-crop-btn"
                        >
                            + Add New Crop
                        </Link>

                    </div>


                    {/* No crops */}

                    {products.length === 0 ? (

                        <div
                            style={{
                                padding: "40px",
                                textAlign: "center",
                            }}
                        >

                            <div style={{ fontSize: "50px" }}>
                                🌾
                            </div>

                            <h3>
                                No crops listed yet
                            </h3>

                            <p>
                                Add your first crop to start selling.
                            </p>

                            <Link
                                to="/add-crop"
                                className="add-crop-btn"
                            >
                                + Add Crop
                            </Link>

                        </div>

                    ) : (

                        <div className="crop-table">


                            {/* Table Header */}

                            <div className="table-header">

                                <span>
                                    Crop
                                </span>

                                <span>
                                    Price
                                </span>

                                <span>
                                    Quantity
                                </span>

                                <span>
                                    Quality
                                </span>

                                <span>
                                    Status
                                </span>

                            </div>


                            {/* Crop Rows */}

                            {products.map((crop) => (

                                <div
                                    className="crop-row"
                                    key={crop.id}
                                >

                                    {/* Crop */}

                                    <div className="crop-name">

                                        <div className="crop-emoji">
                                            🌾
                                        </div>

                                        <strong>
                                            {crop.crop_name}
                                        </strong>

                                    </div>


                                    {/* Price */}

                                    <span>
                                        ₹
                                        {Number(
                                            crop.expected_price || 0
                                        ).toLocaleString()}
                                    </span>


                                    {/* Quantity */}

                                    <span>
                                        {Number(
                                            crop.quantity || 0
                                        ).toLocaleString()}{" "}
                                        {crop.unit || "kg"}
                                    </span>


                                    {/* Quality */}

                                    <span>
                                        {crop.quality_grade || "Standard"}
                                    </span>


                                    {/* Status */}

                                    <span
                                        className={
                                            crop.is_available
                                                ? "status active"
                                                : "status sold"
                                        }
                                    >
                                        {crop.is_available
                                            ? "Active"
                                            : "Sold Out"}
                                    </span>

                                    <Link
                                        to={`/edit-crop/${crop.id}`}
                                        className="edit-crop-btn"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        className="delete-crop-btn"
                                        onClick={() => handleDelete(crop.id)}
                                        disabled={deletingId === crop.id}
                                    >
                                        {deletingId === crop.id ? "Deleting..." : "Delete"}
                                    </button>
                                </div>

                            ))}

                        </div>

                    )}

                </div>


                {/* ================= RIGHT SIDE ================= */}

                <div className="dashboard-side">


                    {/* ================= AI INSIGHT ================= */}

                    <div className="ai-dashboard-card">

                        <div className="ai-top">

                            <span className="ai-icon">
                                🤖
                            </span>

                            <span>
                                AI INSIGHT
                            </span>

                        </div>

                        <h3>
                            AI Price Intelligence
                        </h3>

                        <p>
                            Get AI-powered crop demand and
                            price recommendations to make
                            better selling decisions.
                        </p>

                        <button
                            onClick={() =>
                                alert(
                                    "AI Price Intelligence will be available soon!"
                                )
                            }
                        >
                            View Price Intelligence →
                        </button>

                    </div>


                    {/* ================= QUICK ACTIONS ================= */}

                    <div className="quick-actions">

                        <h3>
                            Quick Actions
                        </h3>


                        <Link
                            to="/add-crop"
                            className="quick-action-link"
                        >
                            🌾 Add New Crop
                        </Link>


                        <Link
                            to="/seller-orders"
                            className="quick-action-link"
                        >
                            📦 View Orders
                        </Link>


                        <button
                            onClick={() =>
                                alert(
                                    "Earnings section will be available soon!"
                                )
                            }
                        >
                            💰 Earnings
                        </button>


                        <button
                            onClick={() =>
                                alert(
                                    "Profile editing will be available soon!"
                                )
                            }
                        >
                            👤 Edit Profile
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default FarmerDashboard;