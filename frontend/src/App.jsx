import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ProductDetails from "./pages/ProductDetails";
import FarmerDashboard from "./pages/FarmerDashboard";
import AddCrop from "./pages/AddCrop";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import SellerOrders from "./pages/SellerOrders";
import BuyerDashboard from "./pages/BuyerDashboard";
import EditCrop from "./pages/EditCrop";
import FpoDashboard from "./pages/FpoDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === "ADMIN") {
            return <Navigate to="/admin-dashboard" replace />;
        }

        if (user.role === "FARMER") {
            return <Navigate to="/farmer-dashboard" replace />;
        }

        if (user.role === "FPO") {
            return <Navigate to="/fpo-dashboard" replace />;
        }

        if (user.role === "BUYER") {
            return <Navigate to="/buyer-dashboard" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return children;
};
function App() {
    return (
        <BrowserRouter>

            <Navbar />

            <Routes>

                <Route path="/" element={<Home />} />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/product/:id" element={<ProductDetails />} />

                <Route
                    path="/farmer-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["FARMER"]}>
                            <FarmerDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/add-crop"
                    element={
                        <ProtectedRoute allowedRoles={["FARMER", "FPO"]}>
                            <AddCrop />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/edit-crop/:id"
                    element={
                        <ProtectedRoute allowedRoles={["FARMER", "FPO"]}>
                            <EditCrop />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-orders"
                    element={
                        <ProtectedRoute allowedRoles={["BUYER"]}>
                            <MyOrders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/seller-orders"
                    element={
                        <ProtectedRoute allowedRoles={["FARMER", "FPO"]}>
                            <SellerOrders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/order/:id"
                    element={
                        <ProtectedRoute allowedRoles={["BUYER", "FARMER", "FPO"]}>
                            <OrderDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/buyer-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["BUYER"]}>
                            <BuyerDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="/edit-crop/:id" element={<EditCrop />} />
                <Route
                    path="/fpo-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["FPO"]}>
                            <FpoDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin-dashboard"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

            </Routes>


            <Footer />

        </BrowserRouter>
    );
}

export default App;