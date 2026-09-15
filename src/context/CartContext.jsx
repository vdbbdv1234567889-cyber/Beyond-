import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

function getCartKey(productId, selectedSize, selectedColor, selectedDesignUrl) {
  return `${productId}-${selectedSize || "nosize"}-${selectedColor || "nocolor"}-${selectedDesignUrl || "nodesign"}`;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addToCart(product, quantity, options = {}) {
    const { selected_size = null, selected_color = null, selected_design_url = null, customer_weight = null, customer_height = null } = options;
    const key = getCartKey(product.id, selected_size, selected_color, selected_design_url);

    setItems((prev) => {
      const existing = prev.find((item) => item.cartKey === key);
      if (existing) {
        return prev.map((item) =>
          item.cartKey === key
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [
        ...prev,
        {
          cartKey: key,
          id: product.id,
          name: product.name,
          price: product.discount_price && product.discount_price < product.price ? product.discount_price : product.price,
          image_url: product.image_url,
          stock: product.stock,
          quantity,
          selected_size,
          selected_color,
          selected_design_url,
          customer_weight,
          customer_height,
        },
      ];
    });
  }

  function removeFromCart(cartKey) {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  }

  function updateQuantity(cartKey, quantity) {
    setItems((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
          : item
      )
    );
  }

  function clearCart() { setItems([]); }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart لازم يتستخدم جوه CartProvider");
  return context;
}
