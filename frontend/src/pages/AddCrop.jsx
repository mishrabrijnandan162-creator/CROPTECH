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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- AI Demand Forecast state ----
  const SUPPORTED_DEMAND_CROPS = [
    "Maize", "Onion", "Potato", "Rice", "Tomato", "Wheat",
  ];

  const AVAILABILITY_TO_DAYS = {
    "Available Now": 0,
    "Within 7 Days": 7,
    "Within 15 Days": 15,
    "Within 30 Days": 30,
  };

  const [demandInputs, setDemandInputs] = useState({
    activeBuyers: "",
    marketDistance: "",
  });

  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState("");
  const [demandResult, setDemandResult] = useState(null);

  const handleDemandInputChange = (e) => {
    setDemandInputs({
      ...demandInputs,
      [e.target.name]: e.target.value,
    });
  };

  const handleGetDemandForecast = async () => {
    setDemandError("");
    setDemandResult(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setDemandError("Please login as a farmer first.");
      return;
    }

    if (!formData.cropName || !formData.price || !formData.quantity || !formData.availability) {
      setDemandError(
        "Fill in crop name, quantity, price and availability first."
      );
      return;
    }

    const normalizedCrop =
      formData.cropName.trim().charAt(0).toUpperCase() +
      formData.cropName.trim().slice(1).toLowerCase();

    if (!SUPPORTED_DEMAND_CROPS.includes(normalizedCrop)) {
      setDemandError(
        `Demand forecasting currently supports: ${SUPPORTED_DEMAND_CROPS.join(", ")}.`
      );
      return;
    }

    if (!demandInputs.activeBuyers || !demandInputs.marketDistance) {
      setDemandError(
        "Enter an estimated number of active buyers and market distance (km) to get a forecast."
      );
      return;
    }

    setDemandLoading(true);

    try {
      const response = await api.post(
        "/demand/predict",
        {
          crop_name: normalizedCrop,
          price: Number(formData.price),
          inventory: Number(formData.quantity),
          active_buyers: Number(demandInputs.activeBuyers),
          days_to_harvest: AVAILABILITY_TO_DAYS[formData.availability] ?? 0,
          market_distance: Number(demandInputs.marketDistance),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDemandResult(response.data.prediction);
    } catch (err) {
      setDemandError(
        err.response?.data?.message || "Couldn't get a demand forecast right now."
      );
    } finally {
      setDemandLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Get login token
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login as a farmer first.");
        setLoading(false);
        return;
      }

      // Data required by backend
      const productData = {
        crop_name: formData.cropName,
        quantity: Number(formData.quantity),
        unit: "kg",
        quality_grade: formData.quality,
        location: formData.location,
        expected_price: Number(formData.price),
        description: formData.description,

        // Backend may use these if supported
        category: formData.category,
        availability: formData.availability,
      };

      console.log("Sending crop data:", productData);

      const response = await api.post(
        "/products",
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Crop added:", response.data);

      alert("Crop listed successfully! 🌾");

      navigate("/farmer-dashboard");

    } catch (err) {
      console.error("Add crop error:", err);

      if (err.response) {
        console.log("Backend response:", err.response.data);

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


        {/* HEADING */}

        <div className="form-heading">

          <p>FARMER MARKETPLACE</p>

          <h1>Add New Crop</h1>

          <span>
            Add your crop details and make it available for buyers.
          </span>

        </div>


        <form onSubmit={handleSubmit}>


          {/* ================= CROP INFORMATION ================= */}

          <div className="form-section">

            <h2>Crop Information</h2>

            <div className="form-grid">


              {/* CROP NAME */}

              <div className="form-group">

                <label>
                  Crop Name
                </label>

                <input
                  type="text"
                  name="cropName"
                  placeholder="e.g. Wheat"
                  value={formData.cropName}
                  onChange={handleChange}
                  required
                />

              </div>


              {/* CATEGORY */}

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


              {/* QUANTITY */}

              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  name="quantity"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />

              </div>


              {/* PRICE */}

              <div className="form-group">

                <label>
                  Price per Unit (₹)
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


          {/* ================= QUALITY ================= */}

          <div className="form-section">

            <h2>
              Quality & Availability
            </h2>

            <div className="form-grid">


              {/* QUALITY */}

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


              {/* AVAILABILITY */}

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


              {/* LOCATION */}

              <div className="form-group full-width">

                <label>
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Mathura, Uttar Pradesh"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </div>


          {/* ================= DESCRIPTION ================= */}

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


          {/* ================= AI DEMAND FORECAST ================= */}

          <div className="ai-form-card" style={{ flexDirection: "column", alignItems: "stretch" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

              <div className="ai-form-icon">
                🤖
              </div>

              <div>

                <h3>
                  AI Demand Forecast
                </h3>

                <p>
                  Estimate market demand for this crop using our trained
                  model (supports Maize, Onion, Potato, Rice, Tomato, Wheat).
                </p>

              </div>

            </div>

            <div className="form-grid" style={{ marginTop: "16px" }}>

              <div className="form-group">
                <label>Estimated Active Buyers Nearby</label>
                <input
                  type="number"
                  name="activeBuyers"
                  placeholder="e.g. 15"
                  value={demandInputs.activeBuyers}
                  onChange={handleDemandInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Distance to Market (km)</label>
                <input
                  type="number"
                  name="marketDistance"
                  placeholder="e.g. 20"
                  value={demandInputs.marketDistance}
                  onChange={handleDemandInputChange}
                  min="0"
                />
              </div>

            </div>

            <button
              type="button"
              onClick={handleGetDemandForecast}
              disabled={demandLoading}
              style={{ marginLeft: 0, marginTop: "16px", alignSelf: "flex-start" }}
            >
              {demandLoading ? "Forecasting..." : "Get Demand Forecast"}
            </button>

            {demandError && (
              <p style={{ color: "#c62828", fontSize: "13px", marginTop: "10px" }}>
                {demandError}
              </p>
            )}

            {demandResult && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  background: "white",
                  border: "1px solid #d5ebdb",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#176b3a" }}>
                  Predicted demand: {demandResult.demand_level}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#587061" }}>
                  Demand score: {demandResult.demand_score} · Season used: {demandResult.season_used}
                </p>
              </div>
            )}

          </div>


          {/* ================= ERROR ================= */}

          {error && (

            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#ffeaea",
                color: "#c62828",
                fontSize: "14px",
              }}
            >
              {error}
            </div>

          )}


          {/* ================= BUTTONS ================= */}

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