import React, { useEffect, useState } from 'react';
import axios from '../api/client';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/cart');
        setCartItems(response.data);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleUpdateQuantity = (itemId, quantity) => {
    // Logic to update quantity
  };

  const handleRemoveItem = (itemId) => {
    // Logic to remove item
  };

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      {loading ? (
        <p>Loading...</p>
      ) : cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div>
          <ul className="cart-items">
            {cartItems.map((item) => (
              <li key={item.id} className="cart-item">
                <p>{item.name}</p>
                <p>Price: {item.price}</p>
                <p>Quantity: {item.quantity}</p>
                <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                <button onClick={() => handleRemoveItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p>Subtotal: {/* Calculate subtotal */}</p>
            <p>VAT: {/* Calculate VAT */}</p>
            <p>Shipping: {/* Estimate shipping */}</p>
            <p>Total: {/* Calculate total */}</p>
            <button>Continue Shopping</button>
            <button>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;