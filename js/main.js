// ===== CARRITO DE COMPRAS - ZapatoFlex =====

const CART_KEY = 'zapatoflex_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(name, price, image = '') {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price: Number(price), qty: 1, image });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(`¡${name} añadido al carrito! 🛒`);
}

function removeFromCart(name) {
  let cart = getCart().filter(item => item.name !== name);
  saveCart(cart);
  updateCartBadge();
  renderCartPage();
}

function changeQty(name, delta) {
  const cart = getCart();
  const item = cart.find(i => i.name === name);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
  }
  saveCart(cart);
  updateCartBadge();
  renderCartPage();
}

function getTotalCount() {
  return getCart().reduce((acc, item) => acc + item.qty, 0);
}

function getTotalPrice() {
  return getCart().reduce((acc, item) => acc + item.price * item.qty, 0);
}

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO');
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getTotalCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function showToast(msg) {
  let toast = document.getElementById('zf-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zf-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== RENDER CARRITO (carrito.html) =====
function renderCartPage() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p>¡Explora nuestro catálogo y encuentra tus favoritos!</p>
        <a href="/catalogo.html" class="btn btn-dark mt-3">Ver catálogo</a>
      </div>`;
    if (summaryContainer) summaryContainer.innerHTML = '';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-name="${item.name}">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="no-img">👟</div>'}
      </div>
      <div class="cart-item-info">
        <h5>${item.name}</h5>
        <p class="cart-item-price">${formatPrice(item.price)}</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
      </div>
      <div class="cart-item-subtotal">
        ${formatPrice(item.price * item.qty)}
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.name}')" title="Eliminar">✕</button>
    </div>
  `).join('');

  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="cart-summary-box">
        <h4>Resumen del pedido</h4>
        <div class="summary-row"><span>Subtotal (${getTotalCount()} productos)</span><span>${formatPrice(getTotalPrice())}</span></div>
        <div class="summary-row"><span>Envío</span><span>${getTotalPrice() >= 299900 ? '<span class="free-ship">¡Gratis! 🚚</span>' : formatPrice(12000)}</span></div>
        <hr>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(getTotalPrice() >= 299900 ? getTotalPrice() : getTotalPrice() + 12000)}</span></div>
        <button class="btn btn-dark w-100 mt-3 checkout-btn" onclick="handleCheckout()">Finalizar compra</button>
        <a href="/index.html" class="btn btn-outline-secondary w-100 mt-2">Seguir comprando</a>
      </div>
    `;
  }
}

function handleCheckout() {
  showToast('¡Gracias por tu compra! 🎉');
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  setTimeout(() => renderCartPage(), 500);
}

// ===== BÚSQUEDA EN CATÁLOGO =====
function initSearch() {
  const searchInput = document.querySelector('input[type="search"]');
  const searchBtn = document.querySelector('.btn-outline-success');
  if (!searchInput) return;

  function doSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const cards = document.querySelectorAll('.card-contenedor .card');
    let found = 0;

    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const text = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
      const match = !query || title.includes(query) || text.includes(query);

      card.style.display = match ? '' : 'none';
      if (match) found++;
    });

    // Mensaje de sin resultados
    let noResults = document.getElementById('no-results-msg');
    if (found === 0 && query) {
      if (!noResults) {
        noResults = document.createElement('p');
        noResults.id = 'no-results-msg';
        noResults.style.cssText = 'text-align:center;color:#888;width:100%;padding:40px 0;font-size:1.1rem;';
        document.querySelector('.card-contenedor').appendChild(noResults);
      }
      noResults.textContent = `No se encontro resultados para "${searchInput.value.trim()}"`;
      noResults.style.display = 'block';
    } else if (noResults) {
      noResults.style.display = 'none';
    }
  }

  // Buscar al presionar Enter
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Buscar en tiempo real (mientras escribe)
  searchInput.addEventListener('input', () => {
    if (searchInput.value === '') doSearch(); // Restaurar si borra todo
  });

  // Buscar al hacer click en el botón
  if (searchBtn) searchBtn.addEventListener('click', doSearch);
}

// ===== FILTROS POR MARCA =====
function initFiltros() {
  const filtros = document.querySelectorAll('.filtro-btn');
  if (!filtros.length) return;

  filtros.forEach(btn => {
    btn.addEventListener('click', () => {
      filtros.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const marca = btn.textContent.trim().toLowerCase();
      const cards = document.querySelectorAll('.card-contenedor .card');

      cards.forEach(card => {
        const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
        const match = marca === 'todos' || title.includes(marca);
        card.style.display = match ? '' : 'none';
      });

      // Limpiar búsqueda al cambiar filtro
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) searchInput.value = '';
    });
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPage();
  initSearch();
  initFiltros();

  // Botones "Agregar al carrito"
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = btn.dataset.name;
      const price = btn.dataset.price;
      const image = btn.closest('.card')?.querySelector('img')?.src || '';
      addToCart(name, price, image);

      // Feedback visual en el botón
      const original = btn.textContent;
      btn.textContent = '✓ Añadido';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 1200);
    });
  });
});