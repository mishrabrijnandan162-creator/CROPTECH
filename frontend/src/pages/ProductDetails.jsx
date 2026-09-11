import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ProductDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login as a buyer to view product details.");
        setLoading(false);
        return;
      }

      const response = await api.get(`/buyer/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProduct(response.data.product);
    } catch (err) {
      console.error("Product details error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load product details."
      );
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleOrder = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Please login first.");
        navigate("/login");
        return;
      }

      setOrdering(true);
      setError("");

      const response = await api.post(
        "/buyer/orders",
        {
          product_id: product.id,
          quantity: quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        `Order placed successfully!\n\nOrder ID: #${response.data.order.id}`
      );

      navigate(`/order/${response.data.order.id}`);
    } catch (err) {
      console.error("Order error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="product-not-found">
        <h2>Loading product...</h2>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="product-not-found">
        <h2>Unable to Load Product</h2>
        <p>{error}</p>

        <Link to="/marketplace">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Product Not Found</h2>

        <Link to="/marketplace">
          ← Back to Marketplace
        </Link>
      </div>
    );
  }

  const totalPrice =
    quantity * Number(product.expected_price || 0);

  return (
    <div className="product-details-page">

      <Link to="/marketplace" className="back-link">
        ← Back to Marketplace
      </Link>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="product-details-container">

        {/* LEFT SIDE */}
        <div className="product-image-section">

          <div className="big-product-image">
            🌾
          </div>

          <div className="product-category">
            Fresh Farm Product
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="product-info-section">

          <div className="product-title-row">

            <div>
              <h1>{product.crop_name}</h1>

              <p className="hindi-name">
                Fresh agricultural produce
              </p>
            </div>

            <span className="verified-badge">
              ✓ Verified
            </span>

          </div>

          <p className="product-description">
            {product.description ||
              "Fresh agricultural product directly available from the seller."}
          </p>

          <div className="product-price">

            ₹
            {Number(
              product.expected_price || 0
            ).toLocaleString("en-IN")}

            <span>
              / {product.unit || "kg"}
            </span>

          </div>

          <div className="product-info-grid">

            <div className="info-box">
              <span>Quality</span>

              <strong>
                {product.quality_grade || "Standard"}
              </strong>
            </div>

            <div className="info-box">
              <span>Available</span>

              <strong>
                {product.quantity} {product.unit || "kg"}
              </strong>
            </div>

            <div className="info-box">
              <span>Location</span>

              <strong>
                {product.location || "Not specified"}
              </strong>
            </div>

            <div className="info-box">
              <span>Seller</span>

              <strong>
                Farmer / FPO
              </strong>
            </div>

          </div>

          {/* QUANTITY */}
          <div className="quantity-section">

            <h3>Select Quantity</h3>

            <div className="quantity-control">

              <button
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                −
              </button>

              <span>{quantity}</span>

              <button
                onClick={increaseQuantity}
                disabled={quantity >= product.quantity}
              >
                +
              </button>

            </div>

            <p>
              Maximum available:{" "}
              {product.quantity}{" "}
              {product.unit || "kg"}
            </p>

          </div>

          {/* ORDER SUMMARY */}
          <div className="order-summary">

            <div>
              <span>Price per unit</span>

              <strong>
                ₹
                {Number(
                  product.expected_price || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Quantity</span>

              <strong>
                {quantity} {product.unit || "kg"}
              </strong>
            </div>

            <div className="total-row">

              <span>Total Amount</span>

              <strong>
                ₹{totalPrice.toLocaleString("en-IN")}
              </strong>

            </div>

          </div>

          {/* PLACE ORDER */}
          <button
            className="place-order-btn"
            onClick={handleOrder}
            disabled={ordering || product.quantity <= 0}
          >
            {ordering
              ? "Placing Order..."
              : "Place Order →"}
          </button>

          <button
            className="contact-farmer-btn"
            onClick={() =>
              alert("Contact Farmer feature will be added soon.")
            }
          >
            Contact Farmer
          </button>

        </div>
      </div>

      {/* AI INSIGHT */}
      <div className="ai-price-card">

        <div className="ai-icon">
          🤖
        </div>

        <div>
          <h3>AI Market Intelligence</h3>

          <p>
            Current market price information is available
            through the CROP TECH marketplace. AI-powered
            demand and price recommendations will be
            integrated with the AI module.
          </p>
        </div>

      </div>

    </div>
  );
}

export default ProductDetails;