/* ================= НАСТРОЙКИ ================= */
const DELIVERY_FEE = 150;
const FREE_FROM = 800;
const STORAGE_KEY = 'shawarma-cart';

/* ================= ХЕЛПЕРЫ ================= */
const money = n => n.toLocaleString('ru-RU') + ' ₽';
const byId = id => PRODUCTS.find(p => p.id === id);

/* ================= КОРЗИНА (STATE) ================= */
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && typeof saved === 'object') cart = saved;
} catch (e) { cart = {}; }

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
}

/* ================= РЕНДЕР МЕНЮ ================= */
const menuGrid = document.getElementById('menuGrid');

function renderMenu(cat = 'all') {
  const list = cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);
  menuGrid.innerHTML = list.map(p => `
    <article class="card">
      <div class="card-img">
        ${p.hit ? '<span class="hit">ХИТ</span>' : ''}
        ${p.emoji}
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-desc">${p.desc}</p>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add" data-add="${p.id}" aria-label="Добавить ${p.name}">+</button>
        </div>
      </div>
    </article>
  `).join('');
}
renderMenu();

/* Фильтры категорий */
document.getElementById('filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu(btn.dataset.cat);
});

/* ================= ДОБАВЛЕНИЕ В КОРЗИНУ ================= */
menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  addToCart(btn.dataset.add);
});

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  updateBadge(true);
  renderCart();
  toast('Добавлено: ' + byId(id).name);
}

function updateBadge(bump = false) {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  if (bump) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}
updateBadge();

/* ================= РЕНДЕР КОРЗИНЫ ================= */
const drawerBody = document.getElementById('drawerBody');
const drawerFoot = document.getElementById('drawerFoot');
const drawerTitle = document.getElementById('drawerTitle');

function cartTotals() {
  let subtotal = 0, count = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = byId(id);
    if (!p) continue;
    subtotal += p.price * qty;
    count += qty;
  }
  const delivery = count === 0 || subtotal >= FREE_FROM ? 0 : DELIVERY_FEE;
  return { subtotal, count, delivery, total: subtotal + delivery };
}

function renderCart() {
  const items = Object.entries(cart).filter(([id]) => byId(id));

  if (items.length === 0) {
    drawerTitle.textContent = 'Корзина';
    drawerBody.innerHTML = `
      <div class="empty">
        <div class="e-ico">🌯</div>
        <div style="font-weight:800;color:var(--text);font-size:16px">Пока пусто</div>
        <div style="font-size:14px">Добавьте что-нибудь из меню — и мы всё соберём.</div>
      </div>`;
    drawerFoot.innerHTML = '';
    return;
  }

  drawerTitle.textContent = 'Корзина · ' + cartTotals().count;

  drawerBody.innerHTML = items.map(([id, qty]) => {
    const p = byId(id);
    return `
      <div class="cart-item">
        <div class="cart-item-emoji">${p.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${money(p.price * qty)}</div>
          <div class="qty">
            <button data-dec="${id}" aria-label="Меньше">−</button>
            <span>${qty}</span>
            <button data-inc="${id}" aria-label="Больше">+</button>
          </div>
        </div>
        <button class="remove" data-del="${id}" aria-label="Удалить">🗑</button>
      </div>`;
  }).join('');

  const t = cartTotals();
  drawerFoot.innerHTML = `
    <div class="sum-row"><span>Товары (${t.count})</span><span>${money(t.subtotal)}</span></div>
    <div class="sum-row">
      <span>Доставка</span>
      <span>${t.delivery === 0 ? 'бесплатно' : money(t.delivery)}</span>
    </div>
    ${t.delivery > 0 ? `<div class="sum-row" style="font-size:12.5px">До бесплатной доставки: ${money(FREE_FROM - t.subtotal)}</div>` : ''}
    <div class="sum-row total"><span>Итого</span><span>${money(t.total)}</span></div>
    <button class="btn btn-primary" id="checkoutBtn">Оформить заказ</button>
  `;
}
renderCart();

drawerBody.addEventListener('click', e => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const del = e.target.closest('[data-del]');
  if (inc) {
    cart[inc.dataset.inc]++;
  } else if (dec) {
    const id = dec.dataset.dec;
    cart[id]--;
    if (cart[id] <= 0) delete cart[id];
  } else if (del) {
    delete cart[del.dataset.del];
  } else return;
  saveCart();
  updateBadge();
  renderCart();
});

drawerFoot.addEventListener('click', e => {
  if (e.target.closest('#checkoutBtn')) checkout();
});

function checkout() {
  if (cartTotals().count === 0) return;
  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const t = cartTotals();

  drawerTitle.textContent = 'Заказ оформлен';
  drawerBody.innerHTML = `
    <div class="success">
      <div class="ok">✓</div>
      <h3>Заказ №${orderNum} принят!</h3>
      <p>Мы уже начали готовить. Перезвоним на указанный номер в течение 5 минут.</p>
      <p style="color:var(--accent);font-weight:800">Сумма: ${money(t.total)}</p>
    </div>`;
  drawerFoot.innerHTML = `
    <button class="btn btn-primary" onclick="document.getElementById('closeCart').click()">Отлично!</button>`;

  cart = {};
  saveCart();
  updateBadge();
  toast('Заказ №' + orderNum + ' оформлен 🎉');
}

/* ================= ОТКРЫТИЕ / ЗАКРЫТИЕ КОРЗИНЫ ================= */
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');

function openCart() {
  renderCart();
  drawer.classList.add('open');
  overlay.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
}
function closeCart() {
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
  setTimeout(renderCart, 400);
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCart(); closeMobile(); }
});

/* ================= ТОСТ ================= */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ================= ХЕДЕР ПРИ СКРОЛЛЕ ================= */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

/* ================= МОБИЛЬНОЕ МЕНЮ ================= */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMobile() {
  mobileMenu.classList.remove('open');
}
burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.addEventListener('click', e => {
  if (e.target.tagName === 'A') closeMobile();
});

/* ================= АНИМАЦИЯ ПОЯВЛЕНИЯ ================= */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  observer.observe(el);
});
