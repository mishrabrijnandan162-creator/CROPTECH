import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AddCrop.css";

function AddCrop() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        cropName: "",
        category: "",
        quantity: "",
        price: "",
        quality: "",
        location: "",
        availability: "",
        description: "",

        // ================= AI INPUTS =================
        activeBuyers: "20",
        daysToHarvest: "15",
        marketDistance: "30",
        demandSeason: "Rabi",

        competitorPrice: "",
        priceSeason: "Winter",
        customerType: "Regular",
    });

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState("");
    const [aiError, setAiError] = useState("");

    const [aiResult, setAiResult] = useState(null);

    // =========================================================
    // HANDLE FORM CHANGE
    // =========================================================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        // Clear previous AI result when important inputs change
        if (
            [
                "cropName",
                "quantity",
                "price",
                "activeBuyers",
                "daysToHarvest",
                "marketDistance",
                "demandSeason",
                "competitorPrice",
                "priceSeason",
                "customerType",
            ].includes(e.target.name)
        ) {
            setAiResult(null);
        }
    };

    // =========================================================
    // AI ANALYSIS
    // =========================================================

    const handleAIAnalysis = async () => {
        setAiError("");
        setAiResult(null);

        const token = localStorage.getItem("access_token");

        if (!token) {
            setAiError("Please login first.");
            return;
        }

        // Basic validation
        if (!formData.cropName) {
            setAiError("Please select/enter a crop name.");
            return;
        }

        if (!formData.price || Number(formData.price) <= 0) {
            setAiError("Please enter a valid crop price.");
            return;
        }

        if (!formData.quantity || Number(formData.quantity) <= 0) {
            setAiError("Please enter a valid quantity.");
            return;
        }

        if (
            !formData.competitorPrice ||
            Number(formData.competitorPrice) <= 0
        ) {
            setAiError("Please enter the competitor/market price.");
            return;
        }

        setAiLoading(true);

        try {
            // =====================================================
            // STEP 1
            // RUN DEMAND REGRESSOR + DEMAND CLASSIFIER
            // =====================================================

            const demandData = {
                crop_name: formData.cropName,

                price: Number(formData.price),

                inventory: Number(formData.quantity),

                active_buyers: Number(formData.activeBuyers),

                days_to_harvest: Number(formData.daysToHarvest),

                market_distance: Number(formData.marketDistance),

                season: formData.demandSeason,
            };

            console.log("Sending demand data:", demandData);

            const demandResponse = await api.post(
                "/demand/predict",
                demandData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Demand prediction:",
                demandResponse.data
            );

            const demandPrediction =
                demandResponse.data?.prediction;

            if (!demandPrediction) {
                throw new Error(
                    "Demand prediction was not returned by the server."
                );
            }

            // =====================================================
            // STEP 2
            // USE DEMAND SCORE IN PRICE MODEL
            // =====================================================

            const priceData = {
                base_price: Number(formData.price),

                competitor_price:
                    Number(formData.competitorPrice),

                demand:
                    Number(demandPrediction.demand_score),

                inventory:
                    Number(formData.quantity),

                time_to_event:
                    Number(formData.daysToHarvest),

                distance:
                    Number(formData.marketDistance),

                season:
                    formData.priceSeason,

                customer_type:
                    formData.customerType,
            };

            console.log("Sending price data:", priceData);

            const priceResponse = await api.post(
                "/price/predict",
                priceData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Price prediction:",
                priceResponse.data
            );

            const pricePrediction =
                priceResponse.data?.prediction;

            if (!pricePrediction) {
                throw new Error(
                    "Price prediction was not returned by the server."
                );
            }

            // =====================================================
            // STEP 3
            // COMBINE ALL 3 MODEL RESULTS
            // =====================================================

            setAiResult({
                demandScore:
                    demandPrediction.demand_score,

                demandLevel:
                    demandPrediction.demand_level,

                probabilities:
                    demandPrediction.demand_level_probabilities,

                predictedPrice:
                    pricePrediction.predicted_price,

                demandRatio:
                    pricePrediction.demand_ratio_used,

                seasonUsed:
                    demandPrediction.season_used,
            });

        } catch (err) {
            console.error("AI prediction error:", err);

            if (err.response) {
                setAiError(
                    err.response.data?.message ||
                    "AI prediction failed."
                );
            } else {
                setAiError(
                    err.message ||
                    "Unable to connect to AI prediction service."
                );
            }
        } finally {
            setAiLoading(false);
        }
    };

    // =========================================================
    // ADD CROP
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const token =
                localStorage.getItem("access_token");

            if (!token) {
                setError(
                    "Please login as a farmer first."
                );

                setLoading(false);
                return;
            }

            const productData = {
                crop_name: formData.cropName,

                quantity:
                    Number(formData.quantity),

                unit: "kg",

                quality_grade:
                    formData.quality,

                location:
                    formData.location,

                expected_price:
                    Number(formData.price),

                description:
                    formData.description,

                category:
                    formData.category,

                availability:
                    formData.availability,
            };

            console.log(
                "Sending crop data:",
                productData
            );

            const response = await api.post(
                "/products",
                productData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Crop added:",
                response.data
            );

            alert(
                "Crop listed successfully! 🌾"
            );

            const user =
                JSON.parse(
                    localStorage.getItem("user")
                );

            if (user?.role === "FPO") {
                navigate("/fpo-dashboard");
            } else {
                navigate(
                    "/farmer-dashboard"
                );
            }

        } catch (err) {
            console.error(
                "Add crop error:",
                err
            );

            if (err.response) {
                setError(
                    err.response.data?.message ||
                    "Failed to list crop."
                );
            } else {
                setError(
                    "Unable to connect to server. Please check backend."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-crop-page">

            <div className="add-crop-container">

                <Link
                    to="/farmer-dashboard"
                    className="back-link"
                >
                    ← Back to Dashboard
                </Link>

                {/* ================================================= */}
                {/* HEADING */}
                {/* ================================================= */}

                <div className="form-heading">

                    <p>FARMER MARKETPLACE</p>

                    <h1>Add New Crop</h1>

                    <span>
                        Add your crop details and make it
                        available for buyers.
                    </span>

                </div>

                <form onSubmit={handleSubmit}>

                    {/* ================================================= */}
                    {/* CROP INFORMATION */}
                    {/* ================================================= */}

                    <div className="form-section">

                        <h2>Crop Information</h2>

                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Crop Name
                                </label>

                                <select
                                    name="cropName"
                                    value={formData.cropName}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select crop
                                    </option>

                                    <option value="Maize">
                                        Maize
                                    </option>

                                    <option value="Onion">
                                        Onion
                                    </option>

                                    <option value="Potato">
                                        Potato
                                    </option>

                                    <option value="Rice">
                                        Rice
                                    </option>

                                    <option value="Tomato">
                                        Tomato
                                    </option>

                                    <option value="Wheat">
                                        Wheat
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Category
                                </label>

                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select category
                                    </option>

                                    <option value="Vegetables">
                                        Vegetables
                                    </option>

                                    <option value="Grains">
                                        Grains
                                    </option>

                                    <option value="Fruits">
                                        Fruits
                                    </option>

                                    <option value="Oil Seeds">
                                        Oil Seeds
                                    </option>

                                    <option value="Pulses">
                                        Pulses
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Quantity (kg)
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="e.g. 500"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Current Price (₹)
                                </label>

                                <input
                                    type="number"
                                    name="price"
                                    placeholder="e.g. 2500"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* QUALITY */}
                    {/* ================================================= */}

                    <div className="form-section">

                        <h2>
                            Quality & Availability
                        </h2>

                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Crop Quality
                                </label>

                                <select
                                    name="quality"
                                    value={formData.quality}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select quality
                                    </option>

                                    <option value="Premium">
                                        Premium
                                    </option>

                                    <option value="Grade A">
                                        Grade A
                                    </option>

                                    <option value="Grade B">
                                        Grade B
                                    </option>

                                    <option value="Standard">
                                        Standard
                                    </option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>
                                    Availability
                                </label>

                                <select
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select availability
                                    </option>

                                    <option value="Available Now">
                                        Available Now
                                    </option>

                                    <option value="Within 7 Days">
                                        Within 7 Days
                                    </option>

                                    <option value="Within 15 Days">
                                        Within 15 Days
                                    </option>

                                    <option value="Within 30 Days">
                                        Within 30 Days
                                    </option>

                                </select>

                            </div>

                            <div className="form-group full-width">

                                <label>
                                    Location
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    placeholder="e.g. Meerut, Uttar Pradesh"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* DESCRIPTION */}
                    {/* ================================================= */}

                    <div className="form-section">

                        <h2>
                            Additional Details
                        </h2>

                        <div className="form-group">

                            <label>
                                Crop Description
                            </label>

                            <textarea
                                name="description"
                                placeholder="Describe your crop quality, harvesting details, packaging etc."
                                value={formData.description}
                                onChange={handleChange}
                                rows="5"
                            />

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* AI INPUTS */}
                    {/* ================================================= */}

                    <div className="form-section ai-input-section">

                        <div className="ai-section-heading">

                            <div>

                                <h2>
                                    🤖 AI Market Analysis
                                </h2>

                                <p>
                                    These inputs are used by
                                    the trained demand and
                                    price models.
                                </p>

                            </div>

                        </div>

                        <div className="form-grid">

                            {/* ACTIVE BUYERS */}

                            <div className="form-group">

                                <label>
                                    Active Buyers
                                </label>

                                <input
                                    type="number"
                                    name="activeBuyers"
                                    min="0"
                                    value={formData.activeBuyers}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* DAYS TO HARVEST */}

                            <div className="form-group">

                                <label>
                                    Days to Harvest / Event
                                </label>

                                <input
                                    type="number"
                                    name="daysToHarvest"
                                    min="0"
                                    value={formData.daysToHarvest}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* MARKET DISTANCE */}

                            <div className="form-group">

                                <label>
                                    Market Distance (km)
                                </label>

                                <input
                                    type="number"
                                    name="marketDistance"
                                    min="0"
                                    value={formData.marketDistance}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* DEMAND SEASON */}

                            <div className="form-group">

                                <label>
                                    Demand Season
                                </label>

                                <select
                                    name="demandSeason"
                                    value={formData.demandSeason}
                                    onChange={handleChange}
                                >

                                    <option value="Kharif">
                                        Kharif
                                    </option>

                                    <option value="Rabi">
                                        Rabi
                                    </option>

                                    <option value="Zaid">
                                        Zaid
                                    </option>

                                </select>

                            </div>

                            {/* COMPETITOR PRICE */}

                            <div className="form-group">

                                <label>
                                    Competitor / Market Price (₹)
                                </label>

                                <input
                                    type="number"
                                    name="competitorPrice"
                                    placeholder="e.g. 2600"
                                    min="1"
                                    value={formData.competitorPrice}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* PRICE SEASON */}

                            <div className="form-group">

                                <label>
                                    Price Season
                                </label>

                                <select
                                    name="priceSeason"
                                    value={formData.priceSeason}
                                    onChange={handleChange}
                                >

                                    <option value="Autumn">
                                        Autumn
                                    </option>

                                    <option value="Monsoon">
                                        Monsoon
                                    </option>

                                    <option value="Summer">
                                        Summer
                                    </option>

                                    <option value="Winter">
                                        Winter
                                    </option>

                                </select>

                            </div>

                            {/* CUSTOMER TYPE */}

                            <div className="form-group">

                                <label>
                                    Customer Type
                                </label>

                                <select
                                    name="customerType"
                                    value={formData.customerType}
                                    onChange={handleChange}
                                >

                                    <option value="New">
                                        New
                                    </option>

                                    <option value="Regular">
                                        Regular
                                    </option>

                                    <option value="Premium">
                                        Premium
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}
                    {/* AI BUTTON */}
                    {/* ================================================= */}

                    <div className="ai-form-card">

                        <div className="ai-form-icon">
                            🤖
                        </div>

                        <div className="ai-form-content">

                            <h3>
                                AI Demand & Price Intelligence
                            </h3>

                            <p>
                                Run all three trained ML models
                                to estimate demand and calculate
                                an AI-predicted price.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={handleAIAnalysis}
                            disabled={aiLoading}
                        >

                            {aiLoading
                                ? "Analysing..."
                                : "Get AI Analysis"}

                        </button>

                    </div>

                    {/* ================================================= */}
                    {/* AI ERROR */}
                    {/* ================================================= */}

                    {aiError && (

                        <div className="ai-error">
                            {aiError}
                        </div>

                    )}

                    {/* ================================================= */}
                    {/* AI RESULT */}
                    {/* ================================================= */}

                    {aiResult && (

                        <div className="ai-result-card">

                            <div className="ai-result-header">

                                <div>

                                    <span>
                                        CROP TECH AI
                                    </span>

                                    <h2>
                                        Market Intelligence
                                    </h2>

                                </div>

                                <div className="ai-badge">
                                    ML ANALYSIS
                                </div>

                            </div>

                            <div className="ai-result-grid">

                                {/* DEMAND SCORE */}

                                <div className="ai-result-item">

                                    <span>
                                        Demand Score
                                    </span>

                                    <strong>
                                        {aiResult.demandScore}
                                    </strong>

                                </div>

                                {/* DEMAND LEVEL */}

                                <div className="ai-result-item">

                                    <span>
                                        Demand Level
                                    </span>

                                    <strong
                                        className={
                                            aiResult.demandLevel
                                                ?.toLowerCase()
                                        }
                                    >
                                        {aiResult.demandLevel}
                                    </strong>

                                </div>

                                {/* PREDICTED PRICE */}

                                <div className="ai-result-item highlight">

                                    <span>
                                        AI Predicted Price
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            aiResult.predictedPrice
                                        ).toFixed(2)}
                                    </strong>

                                </div>

                                {/* DEMAND RATIO */}

                                <div className="ai-result-item">

                                    <span>
                                        Demand Ratio
                                    </span>

                                    <strong>
                                        {aiResult.demandRatio}
                                    </strong>

                                </div>

                            </div>

                            {/* PROBABILITIES */}

                            {aiResult.probabilities && (

                                <div className="probability-section">

                                    <h3>
                                        Demand Probability
                                    </h3>

                                    <div className="probability-grid">

                                        {Object.entries(
                                            aiResult.probabilities
                                        ).map(
                                            ([level, probability]) => (

                                                <div
                                                    key={level}
                                                    className="probability-item"
                                                >

                                                    <span>
                                                        {level}
                                                    </span>

                                                    <strong>
                                                        {(
                                                            probability * 100
                                                        ).toFixed(1)}
                                                        %
                                                    </strong>

                                                </div>

                                            )
                                        )}

                                    </div>

                                </div>

                            )}

                            <div className="ai-result-note">

                                Season used:
                                <strong>
                                    {" "}
                                    {aiResult.seasonUsed}
                                </strong>

                            </div>

                        </div>

                    )}

                    {/* ================================================= */}
                    {/* NORMAL ERROR */}
                    {/* ================================================= */}

                    {error && (

                        <div className="form-error">
                            {error}
                        </div>

                    )}

                    {/* ================================================= */}
                    {/* BUTTONS */}
                    {/* ================================================= */}

                    <div className="form-actions">

                        <Link
                            to="/farmer-dashboard"
                            className="cancel-btn"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="submit-crop-btn"
                            disabled={loading}
                        >

                            {loading
                                ? "Listing Crop..."
                                : "List Crop →"}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default AddCrop;