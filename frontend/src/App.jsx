import React from class="tok-string">'react';
import { BrowserRouter, Routes, Route, Link } from class="tok-string">'react-router-dom';
import Products from class="tok-string">'./pages/Products';
import Cart from class="tok-string">'./pages/Cart';
 
function App() {
  return (
    <BrowserRouter>
      <nav className=class="tok-string">"navbar">
        <Link to=class="tok-string">"/" className=class="tok-string">"logo">🛒 E-Com Store</Link>
        <div className=class="tok-string">"nav-links">
          <Link to=class="tok-string">"/">Products</Link>
          <Link to=class="tok-string">"/cart">Cart</Link>
        </div>
      </nav>
      <main className=class="tok-string">"container">
        <Routes>
          <Route path=class="tok-string">"/" element={<Products />} />
          <Route path=class="tok-string">"/cart" element={<Cart />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
 
export default App;
