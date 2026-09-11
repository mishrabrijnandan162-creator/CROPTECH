import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
    return (
        <main className="home">

            {/* ================= HERO ================= */}

            <section className="hero">
                <div className="hero-content">

                    <div className="hero-badge">
                        <span>✦</span>
                        AI-Powered Agriculture Marketplace
                    </div>

                    <h1>
                        From <span>Farm</span>
                        <br />
                        Directly to <span className="blue-text">Market.</span>
                    </h1>

                    <p className="hero-description">
                        CROP TECH connects farmers and FPOs directly with consumers
                        and bulk buyers — powered by AI-driven market intelligence
                        and smart logistics.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/marketplace" className="primary-btn">
                            Explore Marketplace
                            <span>→</span>
                        </Link>

                        <Link to="/add-crop" className="secondary-btn">
                            List Your Produce
                        </Link>
                    </div>

                    <div className="hero-trust">
                        <div>
                            <strong>Direct</strong>
                            <span>Market Access</span>
                        </div>

                        <div>
                            <strong>AI</strong>
                            <span>Price Intelligence</span>
                        </div>

                        <div>
                            <strong>Smart</strong>
                            <span>Logistics</span>
                        </div>
                    </div>

                </div>

                {/* HERO VISUAL */}

                <div className="hero-visual">

                    <div className="market-card">

                        <div className="market-card-header">
                            <div>
                                <span className="small-label">LIVE MARKET</span>
                                <h3>Fresh Produce</h3>
                            </div>

                            <span className="live-dot"></span>
                        </div>

                        <div className="produce-visual">
                            <div className="produce-circle">🌾</div>
                        </div>

                        <div className="produce-info">
                            <div>
                                <span>AI Suggested Price</span>
                                <strong>₹24–₹28/kg</strong>
                            </div>

                            <span className="price-up">↑ 8.4%</span>
                        </div>

                        <div className="market-divider"></div>

                        <div className="seller-info">
                            <div className="seller-avatar">F</div>

                            <div>
                                <strong>Verified Farmer</strong>
                                <span>Direct seller</span>
                            </div>

                            <span className="verified">✓</span>
                        </div>

                    </div>

                    <div className="floating-card demand-card">
                        <div className="floating-icon">📈</div>

                        <div>
                            <span>AI Demand</span>
                            <strong>High Demand</strong>
                        </div>
                    </div>

                    <div className="floating-card logistics-card">
                        <div className="floating-icon">🚚</div>

                        <div>
                            <span>Smart Logistics</span>
                            <strong>Route Optimised</strong>
                        </div>
                    </div>

                </div>
            </section>


            {/* ================= CONNECTION ================= */}

            <section className="connection-section">

                <div className="section-heading">
                    <span className="section-label">THE CROP TECH NETWORK</span>

                    <h2>
                        One platform.
                        <br />
                        <span>Everyone connected.</span>
                    </h2>

                    <p>
                        We remove unnecessary intermediaries and create a direct
                        digital connection between producers and buyers.
                    </p>
                </div>

                <div className="network">

                    <div className="network-node farmer-node">
                        <div className="node-icon">🌾</div>
                        <strong>Farmers</strong>
                        <span>List produce directly</span>
                    </div>

                    <div className="network-line">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <div className="network-center">
                        <div className="center-logo">CT</div>
                        <strong>CROP TECH</strong>
                        <span>AI + Marketplace + Logistics</span>
                    </div>

                    <div className="network-line">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                    <div className="network-node buyer-node">
                        <div className="node-icon">🛒</div>
                        <strong>Buyers</strong>
                        <span>Buy directly from source</span>
                    </div>

                </div>

            </section>


            {/* ================= FEATURES ================= */}

            <section className="features-section">

                <div className="section-heading centered">
                    <span className="section-label">WHY CROP TECH</span>

                    <h2>
                        Technology that works
                        <br />
                        <span>for agriculture.</span>
                    </h2>

                    <p>
                        From predicting demand to optimising delivery routes,
                        CROP TECH makes the entire farm-to-market journey smarter.
                    </p>
                </div>


                <div className="feature-grid">

                    <div className="feature-card featured-feature">

                        <div className="feature-icon">🤖</div>

                        <span className="feature-number">01</span>

                        <h3>AI Market Intelligence</h3>

                        <p>
                            Analyse market trends and demand patterns to help farmers
                            make better decisions about what to sell and when.
                        </p>

                        <div className="feature-highlight">
                            <span>AI Demand Forecast</span>
                            <strong>↑ 24%</strong>
                        </div>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">🔗</div>

                        <span className="feature-number">02</span>

                        <h3>Direct Marketplace</h3>

                        <p>
                            Farmers and FPOs can list their produce and connect
                            directly with consumers and bulk buyers.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">🎯</div>

                        <span className="feature-number">03</span>

                        <h3>Smart Matching</h3>

                        <p>
                            Match available produce with relevant buyers based on
                            quantity, demand, location and requirements.
                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">🚚</div>

                        <span className="feature-number">04</span>

                        <h3>Smart Logistics</h3>

                        <p>
                            Optimise delivery routes and consolidate shipments to
                            reduce transportation costs and delays.
                        </p>

                    </div>

                </div>

            </section>


            {/* ================= HOW IT WORKS ================= */}

            <section className="how-section">

                <div className="section-heading centered">
                    <span className="section-label">HOW IT WORKS</span>

                    <h2>
                        From harvest
                        <br />
                        <span>to doorstep.</span>
                    </h2>
                </div>


                <div className="steps">

                    <div className="step">
                        <span className="step-number">01</span>
                        <div className="step-icon">🌾</div>
                        <h3>List Produce</h3>
                        <p>
                            Farmers or FPOs list their available crops,
                            quantity and location.
                        </p>
                    </div>


                    <div className="step">
                        <span className="step-number">02</span>
                        <div className="step-icon">🤖</div>
                        <h3>AI Analysis</h3>
                        <p>
                            AI analyses demand and market conditions to
                            provide useful insights.
                        </p>
                    </div>


                    <div className="step">
                        <span className="step-number">03</span>
                        <div className="step-icon">🤝</div>
                        <h3>Find Buyer</h3>
                        <p>
                            Products are matched with consumers and
                            bulk buyers.
                        </p>
                    </div>


                    <div className="step">
                        <span className="step-number">04</span>
                        <div className="step-icon">🚚</div>
                        <h3>Deliver Smart</h3>
                        <p>
                            Smart logistics helps optimise the route from
                            farm to destination.
                        </p>
                    </div>

                </div>

            </section>


            {/* ================= CTA ================= */}

            <section className="cta-section">

                <div className="cta-content">

                    <span className="section-label">READY TO GET STARTED?</span>

                    <h2>
                        Let's build a smarter
                        <br />
                        <span>farm-to-market future.</span>
                    </h2>

                    <p>
                        Connect directly. Trade transparently.
                        Grow together.
                    </p>

                    <div className="cta-buttons">

                        <Link to="/marketplace" className="primary-btn">
                            Explore Marketplace
                            <span>→</span>
                        </Link>

                        <Link to="/add-crop" className="cta-outline-btn">
                            List Your Produce
                        </Link>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Home;