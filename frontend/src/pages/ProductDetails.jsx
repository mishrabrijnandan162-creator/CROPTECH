import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ProductDetails.css";

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [marketProducts, setMarketProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);
    const [error, setError] = useState("");

    /*
     * ---------------------------------------------------------
     * FETCH PRODUCT + MARKETPLACE DATA
     * ---------------------------------------------------------
     */

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

            // Fetch selected product
            const productResponse = await api.get(
                `/buyer/products/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setProduct(productResponse.data.product);

            // Fetch marketplace products for market comparison
            try {
                const marketplaceResponse = await api.get(
                    "/products",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setMarketProducts(
                    marketplaceResponse.data.products || []
                );
            } catch (marketError) {
                console.warn(
                    "Market intelligence data unavailable:",
                    marketError
                );

                // Keep product details working even if comparison data
                // is unavailable.
                setMarketProducts([]);
            }
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

    /*
     * ---------------------------------------------------------
     * QUANTITY
     * ---------------------------------------------------------
     */

    const increaseQuantity = () => {
        if (product && quantity < Number(product.quantity)) {
            setQuantity(quantity + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    /*
     * ---------------------------------------------------------
     * PLACE ORDER
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * AI MARKET INTELLIGENCE
     * ---------------------------------------------------------
     *
     * The current project does not yet have a trained ML model
     * or separate AI backend endpoint.
     *
     * Therefore this module calculates an indicative market
     * insight using available marketplace data:
     *
     * 1. Average market price
     * 2. Current product price
     * 3. Available supply
     * 4. Number of similar listings
     *
     * This keeps the feature functional without pretending that
     * a machine-learning model is already connected.
     */

    const aiInsight = useMemo(() => {
        if (!product) {
            return null;
        }

        const currentPrice = Number(
            product.expected_price || 0
        );

        const currentQuantity = Number(
            product.quantity || 0
        );

        const currentCrop = String(
            product.crop_name || ""
        ).trim().toLowerCase();

        /*
         * Find products with the same crop.
         */
        const similarProducts = marketProducts.filter(
            (item) => {
                const itemCrop = String(
                    item.crop_name || ""
                )
                    .trim()
                    .toLowerCase();

                return itemCrop === currentCrop;
            }
        );

        /*
         * Include current product if the marketplace endpoint
         * does not already contain it.
         */
        const productAlreadyIncluded = similarProducts.some(
            (item) => Number(item.id) === Number(product.id)
        );

        const comparisonProducts = productAlreadyIncluded
            ? similarProducts
            : [...similarProducts, product];

        /*
         * Calculate average market price.
         */
        const prices = comparisonProducts
            .map((item) => Number(item.expected_price || 0))
            .filter((price) => price > 0);

        let averagePrice = currentPrice;

        if (prices.length > 0) {
            averagePrice =
                prices.reduce(
                    (sum, price) => sum + price,
                    0
                ) / prices.length;
        }

        /*
         * Calculate price difference.
         */
        let priceDifference = 0;

        if (averagePrice > 0) {
            priceDifference =
                ((currentPrice - averagePrice) /
                    averagePrice) *
                100;
        }

        /*
         * Calculate total supply among similar listings.
         */
        const totalSupply = comparisonProducts.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );

        /*
         * Determine price position.
         */
        let priceStatus;
        let priceMessage;

        if (priceDifference <= -10) {
            priceStatus = "Below Market";
            priceMessage =
                "This listing is priced below the estimated marketplace average.";
        } else if (priceDifference >= 10) {
            priceStatus = "Above Market";
            priceMessage =
                "This listing is priced above the estimated marketplace average.";
        } else {
            priceStatus = "Competitive";
            priceMessage =
                "This listing is competitively priced compared with similar listings.";
        }

        /*
         * Determine supply level.
         */
        let supplyStatus;
        let supplyMessage;

        if (totalSupply < 100) {
            supplyStatus = "Low";
            supplyMessage =
                "Limited supply is currently visible for this crop.";
        } else if (totalSupply < 500) {
            supplyStatus = "Moderate";
            supplyMessage =
                "A moderate amount of this crop is currently available.";
        } else {
            supplyStatus = "High";
            supplyMessage =
                "A relatively high quantity of this crop is currently available.";
        }

        /*
         * Estimate demand using listing count and supply.
         *
         * This is an indicative signal, not a trained AI forecast.
         */
        let demandStatus;

        if (
            comparisonProducts.length >= 5 &&
            totalSupply < 500
        ) {
            demandStatus = "High";
        } else if (
            comparisonProducts.length >= 3 ||
            totalSupply < 1000
        ) {
            demandStatus = "Moderate";
        } else {
            demandStatus = "Low";
        }

        /*
         * Market outlook.
         */
        let outlook;

        if (
            demandStatus === "High" &&
            supplyStatus === "Low"
        ) {
            outlook =
                "Positive market conditions detected.";
        } else if (
            demandStatus === "High"
        ) {
            outlook =
                "Demand appears stronger than the visible supply.";
        } else if (
            supplyStatus === "High"
        ) {
            outlook =
                "Higher supply may create stronger price competition.";
        } else {
            outlook =
                "Market conditions appear relatively balanced.";
        }

        /*
         * Recommendation.
         */
        let recommendation;

        if (
            priceDifference < -10 &&
            demandStatus === "High"
        ) {
            recommendation =
                "This product appears competitively priced while demand signals are positive.";
        } else if (
            priceDifference > 10 &&
            demandStatus === "Low"
        ) {
            recommendation =
                "Compare other listings before purchasing because this price is relatively high.";
        } else if (
            supplyStatus === "Low"
        ) {
            recommendation =
                "Limited visible supply may support this listing's market position.";
        } else {
            recommendation =
                "Compare price, quality and location before placing your order.";
        }

        return {
            averagePrice,
            currentPrice,
            priceDifference,
            priceStatus,
            priceMessage,
            supplyStatus,
            supplyMessage,
            demandStatus,
            outlook,
            recommendation,
            similarListings: comparisonProducts.length,
            totalSupply,
            currentQuantity,
        };
    }, [product, marketProducts]);

    /*
     * ---------------------------------------------------------
     * LOADING
     * ---------------------------------------------------------
     */

    if (loading) {
        return (
            <div className="product-not-found">
                <div className="loading-icon">🌾</div>
                <h2>Loading product...</h2>
                <p>
                    Preparing product and market information.
                </p>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * ERROR
     * ---------------------------------------------------------
     */

    if (error && !product) {
        return (
            <div className="product-not-found">
                <div className="not-found-icon">⚠️</div>

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
                <div className="not-found-icon">🌾</div>

                <h2>Product Not Found</h2>

                <Link to="/marketplace">
                    ← Back to Marketplace
                </Link>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * TOTAL PRICE
     * ---------------------------------------------------------
     */

    const totalPrice =
        quantity * Number(product.expected_price || 0);

    return (
        <div className="product-details-page">

            {/* BACK */}
            <Link
                to="/marketplace"
                className="back-link"
            >
                ← Back to Marketplace
            </Link>

            {/* ERROR */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="product-details-container">

                {/* =================================================
            LEFT SIDE
        ================================================= */}

                <div className="product-image-section">

                    <div className="big-product-image">
                        🌾
                    </div>

                    <div className="product-category">
                        Fresh Farm Product
                    </div>

                    <div className="product-image-note">
                        Directly available through CROP TECH
                    </div>

                </div>

                {/* =================================================
            RIGHT SIDE
        ================================================= */}

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

                    {/* PRICE */}

                    <div className="product-price">
                        ₹
                        {Number(
                            product.expected_price || 0
                        ).toLocaleString("en-IN")}

                        <span>
                            / {product.unit || "kg"}
                        </span>
                    </div>

                    {/* PRODUCT INFORMATION */}

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
                                {product.quantity}{" "}
                                {product.unit || "kg"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <span>Location</span>

                            <strong>
                                {product.location ||
                                    "Not specified"}
                            </strong>
                        </div>

                        <div className="info-box">
                            <span>Seller</span>

                            <strong>
                                Farmer / FPO
                            </strong>
                        </div>

                    </div>

                    {/* =================================================
              QUANTITY
          ================================================= */}

                    <div className="quantity-section">

                        <h3>Select Quantity</h3>

                        <div className="quantity-control">

                            <button
                                onClick={decreaseQuantity}
                                disabled={quantity <= 1}
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>

                            <span>{quantity}</span>

                            <button
                                onClick={increaseQuantity}
                                disabled={
                                    quantity >=
                                    Number(product.quantity)
                                }
                                aria-label="Increase quantity"
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

                    {/* =================================================
              ORDER SUMMARY
          ================================================= */}

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
                                {quantity}{" "}
                                {product.unit || "kg"}
                            </strong>
                        </div>

                        <div className="total-row">

                            <span>Total Amount</span>

                            <strong>
                                ₹
                                {totalPrice.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                        </div>

                    </div>

                    {/* =================================================
              BUTTONS
          ================================================= */}

                    <button
                        className="place-order-btn"
                        onClick={handleOrder}
                        disabled={
                            ordering ||
                            Number(product.quantity) <= 0
                        }
                    >
                        {ordering
                            ? "Placing Order..."
                            : "Place Order →"}
                    </button>

                    <button
                        className="contact-farmer-btn"
                        onClick={() =>
                            alert(
                                "Contact Farmer feature will be added soon."
                            )
                        }
                    >
                        Contact Farmer
                    </button>

                </div>
            </div>

            {/* =====================================================
          AI MARKET INTELLIGENCE
      ===================================================== */}

            {aiInsight && (
                <section className="ai-market-card">

                    {/* HEADER */}

                    <div className="ai-market-header">

                        <div className="ai-heading">

                            <div className="ai-icon">
                                🤖
                            </div>

                            <div>
                                <h2>
                                    AI Market Intelligence
                                </h2>

                                <p>
                                    Smart insights based on current
                                    marketplace data
                                </p>
                            </div>

                        </div>

                        <span className="ai-live-badge">
                            ● LIVE ANALYSIS
                        </span>

                    </div>

                    {/* SUMMARY */}

                    <div className="ai-summary">

                        <div className="ai-summary-item">

                            <span>Market Price</span>

                            <strong>
                                ₹
                                {Math.round(
                                    aiInsight.averagePrice
                                ).toLocaleString("en-IN")}
                            </strong>

                            <small>
                                Estimated average
                            </small>

                        </div>

                        <div className="ai-summary-item">

                            <span>Current Price</span>

                            <strong>
                                ₹
                                {aiInsight.currentPrice.toLocaleString(
                                    "en-IN"
                                )}
                            </strong>

                            <small>
                                This listing
                            </small>

                        </div>

                        <div className="ai-summary-item">

                            <span>Similar Listings</span>

                            <strong>
                                {aiInsight.similarListings}
                            </strong>

                            <small>
                                Marketplace
                            </small>

                        </div>

                        <div className="ai-summary-item">

                            <span>Visible Supply</span>

                            <strong>
                                {aiInsight.totalSupply}
                            </strong>

                            <small>
                                Total units
                            </small>

                        </div>

                    </div>

                    {/* AI INSIGHTS */}

                    <div className="ai-insights-grid">

                        {/* DEMAND */}

                        <div className="ai-insight-box">

                            <div className="ai-insight-top">

                                <span className="ai-insight-icon">
                                    📈
                                </span>

                                <span>
                                    Demand
                                </span>

                            </div>

                            <strong
                                className={`ai-status ${aiInsight.demandStatus.toLowerCase()}`}
                            >
                                {aiInsight.demandStatus}
                            </strong>

                            <p>
                                Based on visible marketplace
                                activity and supply signals.
                            </p>

                        </div>

                        {/* SUPPLY */}

                        <div className="ai-insight-box">

                            <div className="ai-insight-top">

                                <span className="ai-insight-icon">
                                    📦
                                </span>

                                <span>
                                    Supply
                                </span>

                            </div>

                            <strong
                                className={`ai-status ${aiInsight.supplyStatus.toLowerCase()}`}
                            >
                                {aiInsight.supplyStatus}
                            </strong>

                            <p>
                                {aiInsight.supplyMessage}
                            </p>

                        </div>

                        {/* PRICE */}

                        <div className="ai-insight-box">

                            <div className="ai-insight-top">

                                <span className="ai-insight-icon">
                                    💰
                                </span>

                                <span>
                                    Price Position
                                </span>

                            </div>

                            <strong
                                className={`ai-status price-${aiInsight.priceStatus
                                    .toLowerCase()
                                    .replace(" ", "-")}`}
                            >
                                {aiInsight.priceStatus}
                            </strong>

                            <p>
                                {aiInsight.priceMessage}
                            </p>

                        </div>

                    </div>

                    {/* OUTLOOK */}

                    <div className="ai-outlook">

                        <div className="ai-outlook-icon">
                            💡
                        </div>

                        <div>

                            <h3>
                                Market Outlook
                            </h3>

                            <p>
                                {aiInsight.outlook}
                            </p>

                        </div>

                    </div>

                    {/* RECOMMENDATION */}

                    <div className="ai-recommendation">

                        <div className="recommendation-icon">
                            ✨
                        </div>

                        <div>

                            <h3>
                                AI Recommendation
                            </h3>

                            <p>
                                {aiInsight.recommendation}
                            </p>

                        </div>

                    </div>

                    {/* DISCLAIMER */}

                    <div className="ai-disclaimer">

                        <span>ℹ️</span>

                        <p>
                            This is an indicative AI-style market
                            analysis generated from currently
                            available CROP TECH marketplace data.
                            Future versions can connect this module
                            to a trained demand-forecasting model
                            for more advanced predictions.
                        </p>

                    </div>

                </section>
            )}

        </div>
    );
}

export default ProductDetails;