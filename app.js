const view = document.getElementById("view");
const bar = document.getElementById("cart-bar");
const search = document.getElementById("q");
const CART_KEY = "hometown-cart";
const DELIVERY_PER_SHOP = 49;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const town = (id) => TOWNS.find((t) => t.id === id);
const shop = (id) => SHOPS.find((s) => s.id === id);
const PRODUCTS = SHOPS.flatMap((s) => s.products.map((p) => ({ ...p, shop: s, key: `${s.id}/${p.id}` })));
const product = (key) => PRODUCTS.find((p) => p.key === key);

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
}
let cart = readCart();

function setQty(key, qty) {
  const { [key]: _, ...rest } = cart;
  cart = qty > 0 ? { ...rest, [key]: qty } : rest;
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private window: cart lasts this page only */ }
  document.querySelectorAll(`[data-ctl="${key}"]`).forEach((el) => { el.innerHTML = control(key); });
  drawBar();
}

function cartLines() {
  return Object.entries(cart).map(([key, qty]) => ({ p: product(key), qty })).filter((l) => l.p);
}

function control(key) {
  const qty = cart[key] || 0;
  return qty
    ? `<div class="stepper"><button data-dec="${key}" aria-label="Remove one">−</button><span>${qty}</span><button data-inc="${key}" aria-label="Add one">+</button></div>`
    : `<button class="add" data-inc="${key}">ADD</button>`;
}

function stars(r, n) {
  return `<span class="rating">★ ${r}<small>(${n.toLocaleString("en-IN")})</small></span>`;
}

function off(p) {
  const pct = Math.round((1 - p.price / p.mrp) * 100);
  return pct > 0 ? `<span class="off">${pct}% OFF</span>` : "";
}

function card(p) {
  return `<article class="card">
    <a class="thumb" href="#/shop/${p.shop.id}" style="--tone:${p.shop.tone}">${off(p)}<span>${p.icon}</span></a>
    <span class="eta">⏱ ${p.shop.days} days</span>
    <h3>${esc(p.name)}</h3>
    <p class="unit">${esc(p.unit)}</p>
    <a class="from" href="#/shop/${p.shop.id}">${esc(p.shop.name)}, ${esc(town(p.shop.town).name)}</a>
    <div class="buy">
      <span class="price">${rupees(p.price)}${p.mrp > p.price ? `<s>${rupees(p.mrp)}</s>` : ""}</span>
      <div data-ctl="${p.key}">${control(p.key)}</div>
    </div>
  </article>`;
}

const grid = (list) => list.length
  ? `<div class="grid">${list.map(card).join("")}</div>`
  : `<p class="empty">Nothing here yet. <a href="#/sell">Know a shop? Ask them to join.</a></p>`;

function chips(active) {
  return `<nav class="chips" aria-label="Categories">
    <a href="#/" class="${active ? "" : "on"}"><span>🏠</span>All</a>
    ${CATEGORIES.map((c) => `<a href="#/cat/${c.id}" class="${c.id === active ? "on" : ""}"><span>${c.icon}</span>${esc(c.name)}</a>`).join("")}
  </nav>`;
}

function shopTile(s) {
  return `<a class="shop-tile" href="#/shop/${s.id}">
    <span class="logo" style="--tone:${s.tone}">${esc(s.name[0])}</span>
    <span><strong>${esc(s.name)}</strong><small>${esc(town(s.town).name)} · since ${s.since}</small>${stars(s.rating, s.reviews)}</span>
  </a>`;
}

function home() {
  view.innerHTML = `
    ${chips()}
    <section class="hero">
      <div>
        <p class="tag">Direct from the shop that made it</p>
        <h1>Your hometown's famous sweets, at your door</h1>
        <p>No warehouses. No middlemen. Shipped by the shop in 2 to 5 days.</p>
      </div>
      <span class="hero-art">🍬🥨🎁</span>
    </section>
    <h2>Shop by hometown</h2>
    <div class="towns">${TOWNS.map((t) => `
      <a href="#/town/${t.id}"><span>${t.icon}</span><strong>${esc(t.name)}</strong><small>${esc(t.known)}</small></a>`).join("")}
    </div>
    <h2>Bestsellers <a href="#/cat/sweets">See all</a></h2>
    <div class="rail">${PRODUCTS.filter((p) => p.best).map(card).join("")}</div>
    <h2>Top rated shops</h2>
    <div class="shops">${[...SHOPS].sort((a, b) => b.rating - a.rating).map(shopTile).join("")}</div>
    <h2>All products</h2>
    ${grid(PRODUCTS)}`;
}

function categoryPage(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) return notFound();
  view.innerHTML = `${chips(id)}<h1 class="page">${esc(c.name)}</h1>${grid(PRODUCTS.filter((p) => p.cat === id))}`;
}

function townPage(id) {
  const t = town(id);
  if (!t) return notFound();
  view.innerHTML = `
    ${chips()}
    <h1 class="page">${t.icon} ${esc(t.name)} <small>${esc(t.state)} · PIN ${t.pin}</small></h1>
    <div class="shops">${SHOPS.filter((s) => s.town === id).map(shopTile).join("")}</div>
    <h2>Products from ${esc(t.name)}</h2>
    ${grid(PRODUCTS.filter((p) => p.shop.town === id))}`;
}

function shopPage(id) {
  const s = shop(id);
  if (!s) return notFound();
  const t = town(s.town);
  view.innerHTML = `
    <header class="shop-head" style="--tone:${s.tone}">
      <span class="logo big">${esc(s.name[0])}</span>
      <div>
        <h1>${esc(s.name)}</h1>
        <p>${esc(t.name)}, ${esc(t.state)} · since ${s.since}</p>
        <div class="badges">${stars(s.rating, s.reviews)}<span>⏱ Ships in ${s.days} days</span><span>✔ Verified shop</span></div>
      </div>
    </header>
    <p class="story">${esc(s.story)}</p>
    <h2>${s.products.length} products</h2>
    ${grid(PRODUCTS.filter((p) => p.shop.id === id))}`;
}

function searchPage(term) {
  const q = term.toLowerCase();
  const found = PRODUCTS.filter((p) => {
    const t = town(p.shop.town);
    return [p.name, p.shop.name, t.name, t.pin, t.state, t.known].some((v) => v.toLowerCase().includes(q));
  });
  view.innerHTML = `${chips()}<h1 class="page">${found.length} results for "${esc(term)}"</h1>${grid(found)}`;
}

function cartPage() {
  const lines = cartLines();
  if (!lines.length) {
    view.innerHTML = `<div class="empty-cart"><span>🛒</span><h1>Your basket is empty</h1><a class="cta" href="#/">Start shopping</a></div>`;
    return;
  }
  const items = lines.reduce((sum, l) => sum + l.qty * l.p.price, 0);
  const mrp = lines.reduce((sum, l) => sum + l.qty * l.p.mrp, 0);
  const shops = new Set(lines.map((l) => l.p.shop.id)).size;
  const delivery = shops * DELIVERY_PER_SHOP;
  view.innerHTML = `
    <h1 class="page">Basket</h1>
    ${mrp > items ? `<p class="saving">You save ${rupees(mrp - items)} on this order</p>` : ""}
    <div class="checkout">
      <ul class="lines">${lines.map((l) => `
        <li>
          <span class="mini" style="--tone:${l.p.shop.tone}">${l.p.icon}</span>
          <div><strong>${esc(l.p.name)}</strong><small>${esc(l.p.unit)} · ${esc(l.p.shop.name)}</small></div>
          <div data-ctl="${l.p.key}">${control(l.p.key)}</div>
          <span class="price">${rupees(l.qty * l.p.price)}</span>
        </li>`).join("")}
      </ul>
      <aside class="bill">
        <h2>Bill details</h2>
        <p><span>Item total</span><span>${mrp > items ? `<s>${rupees(mrp)}</s> ` : ""}${rupees(items)}</span></p>
        <p><span>Delivery (${shops} ${shops > 1 ? "shops" : "shop"} × ${rupees(DELIVERY_PER_SHOP)})</span><span>${rupees(delivery)}</span></p>
        <p class="grand"><span>To pay</span><span>${rupees(items + delivery)}</span></p>
        <small>Each shop packs and ships its own items.</small>
        <button class="cta" id="checkout">Place order</button>
      </aside>
    </div>`;
  document.getElementById("checkout").addEventListener("click", () => {
    Object.keys(cart).forEach((k) => setQty(k, 0));
    view.innerHTML = `<div class="empty-cart"><span>✅</span><h1>Order placed</h1><p>This is a prototype, so no payment was taken and no order was sent.</p><a class="cta" href="#/">Back to shopping</a></div>`;
  });
}

function sellPage() {
  view.innerHTML = `
    <div class="sell">
      <h1 class="page">Sell on Hometown Market</h1>
      <p>List your shop free. We never buy your stock or hold it in a warehouse: you sell directly to the customer.</p>
      <form id="sell" class="form">
        <label>Shop name<input name="shop" required></label>
        <label>Owner name<input name="owner" required></label>
        <label>Town<input name="town" required></label>
        <label>PIN code<input name="pin" required pattern="[0-9]{6}" inputmode="numeric"></label>
        <label>Phone<input name="phone" required type="tel" pattern="[0-9]{10}"></label>
        <label>What do you sell?<textarea name="items" rows="3" required></textarea></label>
        <label>FSSAI licence number (food shops)<input name="fssai" pattern="[0-9]{14}"></label>
        <button class="cta">Send for verification</button>
      </form>
    </div>`;
  document.getElementById("sell").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("shop");
    view.innerHTML = `<div class="empty-cart"><span>🏪</span><h1>Thank you</h1><p>${esc(name)} is in the queue. This prototype does not send the form anywhere yet.</p></div>`;
  });
}

function notFound() {
  view.innerHTML = `<div class="empty-cart"><h1>Not found</h1><a class="cta" href="#/">Back to shopping</a></div>`;
}

function drawBar() {
  const lines = cartLines();
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const total = lines.reduce((a, l) => a + l.qty * l.p.price, 0);
  document.getElementById("cart-count").textContent = count;
  bar.hidden = !count || location.hash === "#/cart";
  bar.innerHTML = `<span><strong>${count} ${count === 1 ? "item" : "items"}</strong> ${rupees(total)}</span><span>View basket ›</span>`;
}

document.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (inc) setQty(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
  if (dec) setQty(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
  if ((inc || dec) && location.hash === "#/cart") cartPage();
});

document.getElementById("search").addEventListener("submit", (e) => {
  e.preventDefault();
  const term = search.value.trim();
  location.hash = term ? `#/search/${encodeURIComponent(term)}` : "#/";
});

function route() {
  const [, page, id = ""] = location.hash.split("/");
  const pages = {
    town: () => townPage(id), shop: () => shopPage(id), cat: () => categoryPage(id),
    search: () => searchPage(decodeURIComponent(id)), cart: cartPage, sell: sellPage,
  };
  (pages[page] || home)();
  drawBar();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
