import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import { WishlistProvider, useWishlist } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { getSettings, resolveImageUrl } from "./services/api";
import HomePage from "./pages/HomePage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import OrderEditPage from "./pages/OrderEditPage";
import WishlistPage from "./pages/WishlistPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import AdminProductFormPage from "./pages/AdminProductFormPage";
import RequireAdminAuth from "./components/RequireAdminAuth";
import WhatsappFloatingButton from "./components/WhatsappFloatingButton";
import { ShoppingBag, ShoppingCart, LayoutDashboard, Heart } from "lucide-react";
import "./App.css";

function Navbar() {
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    getSettings().then((s) => setLogoUrl(s.logo_url)).catch(() => {});
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        {logoUrl ? (
          <img src={resolveImageUrl(logoUrl)} alt="Logo" className="brand-logo" />
        ) : (
          <ShoppingBag size={22} />
        )}
        Store
      </Link>
      <div className="nav-links">
        <Link to="/wishlist" className="cart-link" title="Wishlist">
          <Heart size={20} />
          {wishlistItems.length > 0 && <span className="cart-badge">{wishlistItems.length}</span>}
        </Link>
        <Link to="/cart" className="cart-link">
          <ShoppingCart size={20} />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </Link>
        <Link to="/admin" title="Admin Panel"><LayoutDashboard size={20} /></Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            <Navbar />
            <WhatsappFloatingButton />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductDetailsPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="/order/:id/edit" element={<OrderEditPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<RequireAdminAuth><AdminPage /></RequireAdminAuth>} />
                <Route path="/admin/products/new" element={<RequireAdminAuth><AdminProductFormPage /></RequireAdminAuth>} />
                <Route path="/admin/products/:id/edit" element={<RequireAdminAuth><AdminProductFormPage /></RequireAdminAuth>} />
              </Routes>
            </main>
          </BrowserRouter>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
