import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/crop-tech-logo.png";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setUser(null);

    navigate("/login");
  };

  // Dashboard according to role
  const getDashboardLink = () => {
    if (user?.role === "FARMER") {
      return "/farmer-dashboard";
    }

    if (user?.role === "BUYER") {
      return "/buyer-dashboard";
    }

    if (user?.role === "FPO") {
      return "/fpo-dashboard";
    }

    return "/";
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

              {/* CROP TECH Logo */}
              <Link to="/" className="logo">
                  <img
                      src={logo}
                      alt="CROP TECH"
                      className="logo-image"
                  />
              </Link>


        {/* Navigation Links */}
        <div className="nav-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/marketplace">
            Marketplace
          </Link>

          <Link to="/about">
            How It Works
          </Link>

        </div>


        {/* Right Side */}
        <div className="nav-actions">

          {isLoggedIn ? (

            <>
              {/* Dashboard */}
              <Link
                to={getDashboardLink()}
                className="dashboard-nav-btn"
              >
                Dashboard
              </Link>

              {/* User Name */}
              <span className="nav-user">
                👤 {user?.name || "User"}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                Logout
              </button>
            </>

          ) : (

            <>
              {/* Login */}
              <Link
                to="/login"
                className="login-btn"
              >
                Login
              </Link>

              {/* Register */}
              <Link
                to="/register"
                className="register-btn"
              >
                Get Started
              </Link>
            </>

          )}

        </div>

      </div>
    </nav>
  );
}

export default Navbar;