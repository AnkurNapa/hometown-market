const view = document.getElementById("view");
const cartCount = document.getElementById("cart-count");
const CART_KEY = "hometown-cart";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const town = (id) => TOWNS.find((t) => t.id === id);
const shop = (id) => SHOPS.find((s) => s.id === id);

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
}
function writeCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private window: cart lasts this page only */ }
  cartCount.textContent = Object.values(cart).reduce((a, b) => a + b, 0);
}
let cart = readCart();

// Cart keys look like "shopId/productId"
function cartLines() {
  return Object.entries(cart).map(([key, qty]) => {
    const [shopId, productId] = key.split("/");
    const s = shop(shopId);
    const p = s && s.products.find((x) => x.id === productId);
    return p && { key, qty, s, p };
  }).filter(Boolean);
}

function shopCard(s) {
  const t = town(s.town);
  return `<a class="shop-card" href="#/shop/${s.id}">
    <span class="tile" style="--tone:${s.tone}">${esc(s.name[0])}</span>
    <span><strong>${esc(s.name)}</strong><small>${esc(t.name)} · since ${s.since}</small></span>
  </a>`;
}

function search(q) {
  const term = q.trim().toLowerCase();
  if (!term) return SHOPS;
  return SHOPS.filter((s) => {
    const t = town(s.town);
    return [s.name, t.name, t.pin, t.state, t.known].some((v) => v.toLowerCase().includes(term));
  });
}

function home() {
  view.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Straight from the shop that made it</p>
      <h1>The taste of home,<br>sent from home.</h1>
      <p class="lede">Find the sweet shop, the namkeen counter or the toy maker in your hometown. Order from them directly, wherever you live now.</p>
      <label class="search">
        <span class="sr-only">Search by town, PIN code or shop</span>
        <input id="q" type="search" placeholder="Town, PIN code or shop name" autocomplete="off">
      </label>
    </section>
    <section aria-labelledby="towns-h">
      <h2 id="towns-h">Towns on the market</h2>
      <div class="towns">${TOWNS.map((t) => `
        <a class="town" href="#/town/${t.id}">
          <strong>${esc(t.name)}</strong><small>${esc(t.known)} · ${t.pin}</small>
        </a>`).join("")}
      </div>
    </section>
    <section aria-labelledby="shops-h">
      <h2 id="shops-h">Shops</h2>
      <div id="results" class="shops"></div>
    </section>`;
  const q = document.getElementById("q");
  const results = document.getElementById("results");
  const draw = () => {
    const found = search(q.value);
    results.innerHTML = found.length
      ? found.map(shopCard).join("")
      : `<p class="empty">No shop for "${esc(q.value)}" yet. <a href="#/sell">Know one? Ask them to join.</a></p>`;
  };
  q.addEventListener("input", draw);
  draw();
}

function townPage(id) {
  const t = town(id);
  if (!t) return notFound();
  view.innerHTML = `
    <a class="back" href="#/">All towns</a>
    <h1>${esc(t.name)}</h1>
    <p class="lede">${esc(t.state)} · PIN ${t.pin} · known for ${esc(t.known.toLowerCase())}</p>
    <div class="shops">${SHOPS.filter((s) => s.town === id).map(shopCard).join("")}</div>`;
}

function shopPage(id) {
  const s = shop(id);
  if (!s) return notFound();
  const t = town(s.town);
  view.innerHTML = `
    <a class="back" href="#/town/${t.id}">${esc(t.name)}</a>
    <header class="shop-head" style="--tone:${s.tone}">
      <div class="shop-photo" role="img" aria-label="Shop photo placeholder">${esc(s.name[0])}</div>
      <div>
        <p class="eyebrow">${esc(t.name)}, ${esc(t.state)} · since ${s.since}</p>
        <h1>${esc(s.name)}</h1>
        <p class="story">${esc(s.story)}</p>
      </div>
    </header>
    <h2>Products</h2>
    <ul class="products">${s.products.map((p) => `
      <li>
        <div><strong>${esc(p.name)}</strong><small>${esc(p.unit)} · keeps ${esc(p.life.toLowerCase())}</small></div>
        <span class="price">${rupees(p.price)}</span>
        <button data-add="${s.id}/${p.id}">Add</button>
      </li>`).join("")}
    </ul>`;
  view.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.add;
    cart = { ...cart, [key]: (cart[key] || 0) + 1 };
    writeCart(cart);
    b.textContent = `Added (${cart[key]})`;
  }));
}

function cartPage() {
  const lines = cartLines();
  if (!lines.length) {
    view.innerHTML = `<h1>Your basket</h1><p class="lede">Nothing here yet. <a href="#/">Find a shop</a>.</p>`;
    return;
  }
  const total = lines.reduce((sum, l) => sum + l.qty * l.p.price, 0);
  view.innerHTML = `
    <h1>Your basket</h1>
    <ul class="products">${lines.map((l) => `
      <li>
        <div><strong>${esc(l.p.name)}</strong><small>${esc(l.s.name)} · ${esc(l.p.unit)}</small></div>
        <span class="qty">
          <button data-step="${l.key}" data-d="-1" aria-label="One less">−</button>
          ${l.qty}
          <button data-step="${l.key}" data-d="1" aria-label="One more">+</button>
        </span>
        <span class="price">${rupees(l.qty * l.p.price)}</span>
      </li>`).join("")}
    </ul>
    <p class="total">Total <strong>${rupees(total)}</strong></p>
    <p class="note">Each shop packs and ships its own items. Delivery charges are settled at checkout.</p>
    <button class="primary" id="checkout">Place order</button>`;
  view.querySelectorAll("[data-step]").forEach((b) => b.addEventListener("click", () => {
    const { step, d } = b.dataset;
    const qty = (cart[step] || 0) + Number(d);
    const { [step]: _, ...rest } = cart;
    cart = qty > 0 ? { ...rest, [step]: qty } : rest;
    writeCart(cart);
    cartPage();
  }));
  document.getElementById("checkout").addEventListener("click", () => {
    cart = {};
    writeCart(cart);
    view.innerHTML = `<h1>Order placed</h1><p class="lede">This is a prototype, so no payment was taken and no order was sent. In the live version the shop confirms within a day.</p><a class="primary" href="#/">Back to the market</a>`;
  });
}

function sellPage() {
  view.innerHTML = `
    <h1>Sell from your shop</h1>
    <p class="lede">List your shop for free. We never buy your stock or hold it in a warehouse: you sell directly to the customer.</p>
    <form id="sell" class="form">
      <label>Shop name<input name="shop" required></label>
      <label>Owner name<input name="owner" required></label>
      <label>Town<input name="town" required></label>
      <label>PIN code<input name="pin" required pattern="[0-9]{6}" inputmode="numeric"></label>
      <label>Phone<input name="phone" required type="tel" pattern="[0-9]{10}"></label>
      <label>What do you sell?<textarea name="items" rows="3" required></textarea></label>
      <label>FSSAI licence number (food shops)<input name="fssai" pattern="[0-9]{14}"></label>
      <button class="primary">Send for verification</button>
    </form>`;
  document.getElementById("sell").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("shop");
    view.innerHTML = `<h1>Thank you</h1><p class="lede">${esc(name)} is in the queue. This prototype does not send the form anywhere yet; the live version calls you within two working days.</p>`;
  });
}

function notFound() {
  view.innerHTML = `<h1>Not found</h1><p class="lede"><a href="#/">Back to the market</a></p>`;
}

function route() {
  const [, page, id] = location.hash.split("/");
  ({ town: () => townPage(id), shop: () => shopPage(id), cart: cartPage, sell: sellPage }[page] || home)();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
writeCart(cart);
route();
