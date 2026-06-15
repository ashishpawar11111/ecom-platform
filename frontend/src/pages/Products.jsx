import React, { useState, useEffect } from class="tok-string">'react';
 
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetch(class="tok-string">'/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);
 
  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem(class="tok-string">'cart') || class="tok-string">'[]');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem(class="tok-string">'cart', JSON.stringify(cart));
    alert(class="tok-string">`Added ${product.name} to cart`);
  };
 
  if (loading) return <p>Loading products...</p>;
 
  return (
    <div>
      <h1>Products</h1>
      <div className=class="tok-string">"product-grid">
        {products.map(p => (
          <div key={p.id} className=class="tok-string">"product-card">
            <h3>{p.name}</h3>
            <p className=class="tok-string">"price">${p.price}</p>
            <p className=class="tok-string">"stock">{p.stock} in stock</p>
            <button onClick={() => addToCart(p)} disabled={p.stock === 0}>
              {p.stock === 0 ? class="tok-string">'Out of Stock' : class="tok-string">'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
 
export default Products;
