import React, { useState, useEffect } from class="tok-string">'react';
 
function Cart() {
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState(null);
 
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(class="tok-string">'cart') || class="tok-string">'[]');
    setCart(saved);
  }, []);
 
  const removeItem = (id) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem(class="tok-string">'cart', JSON.stringify(updated));
  };
 
  const placeOrder = async () => {
    setOrderStatus(class="tok-string">'processing');
    try {
      for (const item of cart) {
        const res = await fetch(class="tok-string">'/api/products/order', {
          method: class="tok-string">'POST',
          headers: { class="tok-string">'Content-Type': class="tok-string">'application/json' },
          body: JSON.stringify({ productId: item.id, quantity: item.quantity }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
      }
      setCart([]);
      localStorage.removeItem(class="tok-string">'cart');
      setOrderStatus(class="tok-string">'success');
    } catch (err) {
      setOrderStatus(class="tok-string">`error: ${err.message}`);
    }
  };
 
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
 
  return (
    <div>
      <h1>Shopping Cart</h1>
      {cart.length === 0 ? (
        <p>{orderStatus === class="tok-string">'success' ? class="tok-string">'✅ Order placed!' : class="tok-string">'Cart is empty'}</p>
      ) : (
        <>
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td><button onClick={() => removeItem(item.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className=class="tok-string">"cart-footer">
            <p className=class="tok-string">"total">Total: ${total.toFixed(2)}</p>
            <button onClick={placeOrder} disabled={orderStatus === class="tok-string">'processing'}>
              {orderStatus === class="tok-string">'processing' ? class="tok-string">'Processing...' : class="tok-string">'Place Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
 
export default Cart;
