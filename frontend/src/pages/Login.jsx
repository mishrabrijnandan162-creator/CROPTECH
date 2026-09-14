import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", formData);

            console.log("Login response:", response.data);

            // JWT token save
            localStorage.setItem("access_token", response.data.access_token);

            // User information save
            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );
            window.dispatchEvent(new Event("authChanged"));



            // Role based dashboard
            const role = response.data.user.role;

            // Role based dashboard
            if (role === "FARMER") {
                navigate("/farmer-dashboard");
            } else if (role === "BUYER") {
                navigate("/buyer-dashboard");
            } else if (role === "FPO") {
                navigate("/fpo-dashboard");
            }
            else if (role === "ADMIN") {
                navigate("/admin-dashboard");
            }
        } catch (error) {
            console.error("Login error:", error);

            setError(
                error.response?.data?.message ||
                "Login failed. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>Welcome Back</h1>
                <p>Login to your CROP TECH account</p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="register-link">
                    Don't have an account?{" "}
                    <span onClick={() => navigate("/register")}>
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;