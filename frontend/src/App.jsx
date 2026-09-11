import { BrowserRouter, Routes, Route } from "react-router-dom";

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
  element={<FarmerDashboard />}
/>  
        <Route
  path="/add-crop"
  element={<AddCrop />}
/>

        <Route
  path="/my-orders"
  element={<MyOrders />}
/>
<Route
  path="/seller-orders"
  element={<SellerOrders />}
/>
<Route
  path="/order/:id"
  element={<OrderDetails />}
/>

<Route
  path="/buyer-dashboard"
  element={<BuyerDashboard />}
/>

      </Routes>
      

      <Footer />

    </BrowserRouter>
  );
}

export default App;