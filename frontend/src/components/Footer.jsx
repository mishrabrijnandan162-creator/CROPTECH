import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span>🌾</span>
            CROP<span>TECH</span>
          </Link>

          <p>
            AI-powered direct farm-to-market platform connecting
            farmers and FPOs with consumers and bulk buyers.
          </p>

          <div className="footer-socials">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="Twitter">𝕏</a>
          </div>
        </div>


        {/* Platform */}
        <div className="footer-column">
          <h3>Platform</h3>

          <Link to="/marketplace">Marketplace</Link>
          <Link to="/about">How It Works</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Get Started</Link>
        </div>


        {/* For Users */}
        <div className="footer-column">
          <h3>For Users</h3>

          <Link to="/register">Farmers</Link>
          <Link to="/register">FPOs</Link>
          <Link to="/register">Buyers</Link>
          <Link to="/register">Logistics Partners</Link>
        </div>


        {/* Features */}
        <div className="footer-column">
          <h3>Features</h3>

          <a href="#">AI Demand Forecast</a>
          <a href="#">Price Intelligence</a>
          <a href="#">Smart Matching</a>
          <a href="#">Smart Logistics</a>
        </div>

      </div>


      {/* Bottom */}
      <div className="footer-bottom">

        <p>
          © 2026 CROP TECH. All rights reserved.
        </p>

        <div>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>

      </div>

    </footer>
  );
}

export default Footer;