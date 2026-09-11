import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Marketplace.css";

function Marketplace() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sortBy, setSortBy] = useState("recommended");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const response = await api.get("/products");

            console.log("Products API response:", response.data);

            setProducts(response.data.products || []);
            setError("");
        } catch (err) {
            console.error("Products error:", err);
            setError("Unable to load products.");
        } finally {
            setLoading(false);
        }
    };

    // Determine a simple category from the crop name.
    // This works even though the backend currently does not
    // provide a separate category field.
    const getCategory = (cropName = "") => {
        const name = cropName.toLowerCase();

        const vegetables = [
            "tomato",
            "potato",
            "onion",
            "carrot",
            "cabbage",
            "cauliflower",
            "spinach",
            "pea",
            "peas",
            "brinjal",
            "okra",
            "lady finger",
            "chilli",
            "capsicum",
            "radish",
            "garlic"
        ];

        const oilSeeds = [
            "mustard",
            "groundnut",
            "soybean",
            "sunflower",
            "sesame",
            "sesamum",
            "rapeseed"
        ];

        const grains = [
            "wheat",
            "rice",
            "paddy",
            "maize",
            "corn",
            "barley",
            "millet",
            "bajra",
            "jowar",
            "ragi"
        ];

        if (vegetables.some((item) => name.includes(item))) {
            return "Vegetables";
        }

        if (oilSeeds.some((item) => name.includes(item))) {
            return "Oil Seeds";
        }

        if (grains.some((item) => name.includes(item))) {
            return "Grains";
        }

        return "Other";
    };

    const filteredProducts = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        let result = products.filter((product) => {
            const cropName = product.crop_name || "";
            const location = product.location || "";

            const matchesSearch =
                cropName.toLowerCase().includes(searchText) ||
                location.toLowerCase().includes(searchText);

            const matchesCategory =
                category === "All" ||
                getCategory(cropName) === category;

            return matchesSearch && matchesCategory;
        });

        // Sorting
        if (sortBy === "price-low") {
            result = [...result].sort(
                (a, b) =>
                    Number(a.expected_price || 0) -
                    Number(b.expected_price || 0)
            );
        }

        if (sortBy === "price-high") {
            result = [...result].sort(
                (a, b) =>
                    Number(b.expected_price || 0) -
                    Number(a.expected_price || 0)
            );
        }

        if (sortBy === "quantity") {
            result = [...result].sort(
                (a, b) =>
                    Number(b.quantity || 0) -
                    Number(a.quantity || 0)
            );
        }

        return result;
    }, [products, search, category, sortBy]);

    return (
        <main className="marketplace-page">

            {/* ================= HEADER ================= */}

            <section className="marketplace-header">

                <div className="marketplace-heading">

                    <span className="market-label">
                        CROP TECH MARKETPLACE
                    </span>

                    <h1>
                        Fresh produce,
                        <br />
                        <span>direct from farmers.</span>
                    </h1>

                    <p>
                        Discover quality agricultural produce directly from
                        farmers and FPOs. Compare listings, prices and
                        locations in one transparent marketplace.
                    </p>

                </div>


                <div className="market-header-card">

                    <div className="market-header-icon">
                        🌱
                    </div>

                    <div>
                        <strong>Direct Market Access</strong>

                        <p>
                            Connecting producers with buyers
                        </p>
                    </div>

                </div>

            </section>


            {/* ================= MARKET TOOLS ================= */}

            <section className="market-tools">

                <div className="search-box">

                    <span className="search-icon">
                        ⌕
                    </span>

                    <input
                        type="text"
                        placeholder="Search crops or locations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {search && (
                        <button
                            className="clear-search"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}

                </div>


                <div className="category-buttons">

                    {[
                        "All",
                        "Vegetables",
                        "Grains",
                        "Oil Seeds"
                    ].map((item) => (

                        <button
                            key={item}
                            className={
                                category === item ? "active" : ""
                            }
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </button>

                    ))}

                </div>

            </section>


            {/* ================= RESULT HEADER ================= */}

            <div className="market-result-header">

                <div className="result-count">

                    <strong>
                        Available Produce
                    </strong>

                    <span>
                        {loading
                            ? "Loading listings..."
                            : `${filteredProducts.length} listings`}
                    </span>

                </div>


                <div className="sort-wrapper">

                    <span>Sort by</span>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recommended">
                            Recommended
                        </option>

                        <option value="price-low">
                            Price: Low to High
                        </option>

                        <option value="price-high">
                            Price: High to Low
                        </option>

                        <option value="quantity">
                            Quantity: High to Low
                        </option>
                    </select>

                </div>

            </div>


            {/* ================= PRODUCTS ================= */}

            <section className="products-grid">

                {/* LOADING */}

                {loading && (

                    <div className="market-state">

                        <div className="state-icon">
                            ⏳
                        </div>

                        <h3>
                            Loading produce...
                        </h3>

                        <p>
                            Fetching fresh listings from farmers.
                        </p>

                    </div>

                )}


                {/* ERROR */}

                {!loading && error && (

                    <div className="market-state">

                        <div className="state-icon">
                            ⚠️
                        </div>

                        <h3>
                            {error}
                        </h3>

                        <p>
                            Please make sure the backend server is running.
                        </p>

                        <button
                            className="retry-btn"
                            onClick={fetchProducts}
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* PRODUCTS */}

                {!loading &&
                    !error &&
                    filteredProducts.length > 0 &&
                    filteredProducts.map((product) => (

                        <article
                            className="product-card"
                            key={product.id}
                        >

                            {/* IMAGE */}

                            <div className="product-image">

                                <span className="crop-emoji">
                                    🌾
                                </span>

                                <span className="quality-badge">
                                    ✓ {product.quality_grade || "Standard"}
                                </span>

                                <span className="direct-badge">
                                    Direct
                                </span>

                            </div>


                            {/* CONTENT */}

                            <div className="product-content">

                                <div className="product-title">

                                    <div>

                                        <h3>
                                            {product.crop_name || "Agricultural Produce"}
                                        </h3>

                                        <span>
                                            {getCategory(product.crop_name) === "Other"
                                                ? "Fresh agricultural produce"
                                                : getCategory(product.crop_name)}
                                        </span>

                                    </div>

                                    <span className="verified">
                                        ✓ Verified
                                    </span>

                                </div>


                                {/* PRODUCT INFO */}

                                <div className="product-info">

                                    <div className="info-item">

                                        <span>AVAILABLE</span>

                                        <strong>
                                            {product.quantity || "—"}{" "}
                                            {product.unit || "kg"}
                                        </strong>

                                    </div>


                                    <div className="info-item">

                                        <span>LOCATION</span>

                                        <strong>
                                            {product.location || "Not specified"}
                                        </strong>

                                    </div>

                                </div>


                                {/* PRICE */}

                                <div className="product-bottom">

                                    <div className="product-price">

                                        <span>
                                            Expected price
                                        </span>

                                        <strong>
                                            {product.expected_price
                                                ? `₹${product.expected_price}`
                                                : "Price on request"}

                                            {product.expected_price && (
                                                <small>
                                                    /{product.unit || "kg"}
                                                </small>
                                            )}
                                        </strong>

                                    </div>


                                    <Link
                                        to={`/product/${product.id}`}
                                        className="view-product"
                                    >
                                        View Details
                                        <span>→</span>
                                    </Link>

                                </div>


                                {/* FARMER */}

                                <div className="farmer-info">

                                    <span className="farmer-avatar">
                                        {product.farmer_id ? "F" : "O"}
                                    </span>

                                    <div>

                                        <span>
                                            Listed by
                                        </span>

                                        <strong>
                                            {product.farmer_id
                                                ? `Farmer #${product.farmer_id}`
                                                : product.fpo_id
                                                    ? `FPO #${product.fpo_id}`
                                                    : "Verified Producer"}
                                        </strong>

                                    </div>

                                    <span className="farmer-check">
                                        ✓
                                    </span>

                                </div>

                            </div>

                        </article>

                    ))}


                {/* NO PRODUCTS */}

                {!loading &&
                    !error &&
                    filteredProducts.length === 0 && (

                        <div className="market-state">

                            <div className="state-icon">
                                🔎
                            </div>

                            <h3>
                                No produce found
                            </h3>

                            <p>
                                Try another crop, location or category.
                            </p>

                            <button
                                className="retry-btn"
                                onClick={() => {
                                    setSearch("");
                                    setCategory("All");
                                }}
                            >
                                Clear Filters
                            </button>

                        </div>

                    )}

            </section>


            {/* ================= AI BANNER ================= */}

            <section className="ai-market-banner">

                <div className="ai-icon">
                    ✦
                </div>


                <div className="ai-banner-content">

                    <span>
                        CROP TECH AI
                    </span>

                    <h2>
                        Make better market decisions.
                    </h2>

                    <p>
                        AI can analyse demand, supply, location and
                        market conditions to provide indicative
                        price and demand insights.
                    </p>

                </div>


                <div className="ai-banner-stat">

                    <strong>
                        AI
                    </strong>

                    <span>
                        Market Intelligence
                    </span>

                </div>

            </section>

        </main>
    );
}

export default Marketplace;