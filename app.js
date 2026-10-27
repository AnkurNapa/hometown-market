const $ = (id) => document.getElementById(id);
const view = $("view");
const search = $("q");
const drawer = $("drawer");

const CART_KEY = "hometown-cart";
const ORDERS_KEY = "hometown-orders";
const ADDRESS_KEY = "hometown-address";
const SIGNUPS_KEY = "hometown-signups";
const MAX_QTY = 10;
const DELIVERY_PER_SHOP = 49;
const SHIP_MARGIN_DAYS = 3; // a food must keep this many days beyond delivery
// ponytail: paste a Formspree form URL here to receive vendor sign ups; empty keeps the form local only
const SIGNUP_URL = "";
const SYNONYMS = { pedha: "peda", pera: "peda", bhujiya: "bhujia", namkin: "namkeen", halva: "halwa", toy: "toys", sweet: "sweets", gift: "gifts" };
const TODAY = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const removedMsg = (names, where) => `${names.join(", ")} can no longer be ordered and ${names.length > 1 ? "were" : "was"} removed${where}`;
const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const town = (id) => TOWNS.find((t) => t.id === id);
const shop = (id) => SHOPS.find((s) => s.id === id);
const PRODUCTS = SHOPS.flatMap((s) => s.products.map((p) => ({ ...p, shop: s, key: `${s.id}/${p.id}` })));
const product = (key) => PRODUCTS.find((p) => p.key === key);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).map((w) => SYNONYMS[w] || w).join(" ");

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window: lasts this page only */ }
}

// Why a product cannot be bought right now, or "" when it can
function blocker(p) {
  if (p.shop.closedUntil && TODAY < p.shop.closedUntil) return `Shop closed till ${shortDate(p.shop.closedUntil)}`;
  if (p.stock === 0) return "Out of stock";
  const life = parseInt(p.life, 10);
  if (life <= p.shop.days + SHIP_MARGIN_DAYS) return `Keeps ${life} days, too short to ship`;
  return "";
}

// Keeps only real, buyable products with whole quantities from 1 to MAX_QTY
function cleanCart(raw) {
  const isMap = raw && typeof raw === "object" && !Array.isArray(raw);
  return Object.entries(isMap ? raw : {}).reduce(({ cart, dropped }, [key, qty]) => {
    const p = product(key);
    const n = Math.min(MAX_QTY, Math.floor(Number(qty)));
    if (!p || blocker(p)) return { cart, dropped: [...dropped, p ? p.name : "An item"] };
    return n >= 1 ? { cart: { ...cart, [key]: n }, dropped } : { cart, dropped };
  }, { cart: {}, dropped: [] });
}

let { cart, dropped: droppedOnLoad } = cleanCart(load(CART_KEY, {}));
store(CART_KEY, cart);
let sortBy = "relevance";
let drawerStep = "cart";

const lines = () => Object.entries(cart).map(([key, qty]) => ({ p: product(key), qty }));
const count = () => lines().reduce((a, l) => a + l.qty, 0);
const itemTotal = () => lines().reduce((a, l) => a + l.qty * l.p.price, 0);
const mrpTotal = () => lines().reduce((a, l) => a + l.qty * l.p.mrp, 0);
const byShop = () => SHOPS.map((s) => ({ s, items: lines().filter((l) => l.p.shop.id === s.id) })).filter((g) => g.items.length);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 3500);
}

function setQty(key, qty) {
  const p = product(key);
  if (!p) return;
  const why = blocker(p);
  if (why && qty > (cart[key] || 0)) return toast(why);
  if (qty > MAX_QTY) toast(`You can add up to ${MAX_QTY} of each item`);
  const n = Math.max(0, Math.min(MAX_QTY, qty));
  const { [key]: _, ...rest } = cart;
  cart = n ? { ...rest, [key]: n } : rest;
  store(CART_KEY, cart);
  refreshControls(key);
  drawCartButtons();
  if (!drawer.hidden && drawerStep === "cart") drawDrawer();
  $("live").textContent = n ? `${p.name}, ${n} in cart` : `${p.name} removed from cart`;
}

function control(key) {
  const p = product(key);
  const why = blocker(p);
  const qty = cart[key] || 0;
  if (why) return `<button class="add" disabled title="${esc(why)}">ADD</button>`;
  if (!qty) return `<button class="add" data-inc="${key}" aria-label="Add ${esc(p.name)}">ADD</button>`;
  return `<div class="stepper"><button data-dec="${key}" aria-label="Remove one ${esc(p.name)}">−</button><span>${qty}</span><button data-inc="${key}" aria-label="Add one more ${esc(p.name)}" ${qty >= MAX_QTY ? "aria-disabled=\"true\" class=\"maxed\"" : ""}>+</button></div>`;
}

// Redraws every ADD control for a product without losing keyboard focus
function refreshControls(key) {
  const focused = document.activeElement && document.activeElement.closest && document.activeElement.closest(`[data-ctl="${key}"]`);
  document.querySelectorAll(`[data-ctl="${key}"]`).forEach((el) => { el.innerHTML = control(key); });
  if (focused) (focused.querySelector("[data-inc]") || focused.querySelector("[data-dec]") || focused.querySelector("button")).focus();
}

function off(p) {
  const pct = Math.round((1 - p.price / p.mrp) * 100);
  return pct > 0 ? pct : 0;
}

function priceBlock(p) {
  return `<span class="price">${rupees(p.price)}${p.mrp > p.price ? `<s>${rupees(p.mrp)}</s>` : ""}</span>`;
}

function card(p) {
  const why = blocker(p);
  const pct = off(p);
  return `<article class="card${why ? " unavailable" : ""}">
    <a class="img" href="#/p/${p.key}" style="--tone:${p.shop.tone}" aria-label="${esc(p.name)}">
      ${pct ? `<span class="off">${pct}%<br>OFF</span>` : ""}<span class="emoji">${p.icon}</span>
      ${why ? `<span class="why">${esc(why)}</span>` : ""}
    </a>
    <span class="eta">⏱ ${p.shop.days} DAYS</span>
    <a href="#/p/${p.key}"><h3>${esc(p.name)}</h3></a>
    <p class="unit">${esc(p.unit)}</p>
    <div class="buy">${priceBlock(p)}<div data-ctl="${p.key}">${control(p.key)}</div></div>
  </article>`;
}

const rail = (title, list, more) => list.length ? `
  <section class="rail-wrap">
    <h2>${esc(title)}${more ? `<a href="${more}">see all</a>` : ""}</h2>
    <div class="rail">${list.map(card).join("")}</div>
  </section>` : "";

const grid = (list) => list.length
  ? `<div class="grid">${list.map(card).join("")}</div>`
  : `<p class="empty">Nothing here yet. <a href="#/sell">Know a shop? Ask them to join.</a></p>`;

// Buyable items first, then the chosen order
function sorted(list) {
  const order = {
    relevance: () => 0,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    discount: (a, b) => off(b) - off(a),
  }[sortBy] || (() => 0);
  return [...list].sort((a, b) => (blocker(a) ? 1 : 0) - (blocker(b) ? 1 : 0) || order(a, b));
}

function tiles() {
  return `<div class="tiles">
    ${CATEGORIES.map((c) => `<a href="#/cat/${c.id}"><span>${c.icon}</span>${esc(c.name)}</a>`).join("")}
    ${TOWNS.map((t) => `<a href="#/town/${t.id}"><span>${t.icon}</span>${esc(t.name)}</a>`).join("")}
  </div>`;
}

function home() {
  view.innerHTML = `
    <a class="banner" href="#/cat/sweets">
      <div>
        <h1>Your hometown's famous sweets, at your door</h1>
        <p>Straight from the shop that made them. No warehouses. No middlemen.</p>
        <span class="banner-cta">Shop now</span>
      </div>
      <span class="banner-art">🍬🥨🎁</span>
    </a>
    <div class="promos">
      <a href="#/cat/gifts" style="--tone:#0c831f"><strong>Festive gift boxes</strong><small>Mixed sweets from old shops</small><span>Order now</span><i>🎁</i></a>
      <a href="#/town/bikaner" style="--tone:#e67700"><strong>Namkeen from Bikaner</strong><small>Fried fresh, packed same day</small><span>Order now</span><i>🥨</i></a>
      <a href="#/town/channapatna" style="--tone:#1971c2"><strong>Channapatna toys</strong><small>Natural lac colours</small><span>Order now</span><i>🪀</i></a>
    </div>
    ${tiles()}
    ${rail("Bestsellers", sorted(PRODUCTS.filter((p) => p.best)))}
    ${CATEGORIES.map((c) => rail(c.name, sorted(PRODUCTS.filter((p) => p.cat === c.id)), `#/cat/${c.id}`)).join("")}`;
}

function listing(kind, id) {
  const isCat = kind === "cat";
  const items = isCat ? CATEGORIES : TOWNS;
  const current = items.find((x) => x.id === id);
  if (!current) return notFound();
  const list = PRODUCTS.filter((p) => (isCat ? p.cat === id : p.shop.town === id));
  const shops = isCat ? [] : SHOPS.filter((s) => s.town === id);
  view.innerHTML = `
    <div class="listing">
      <nav class="side" aria-label="${isCat ? "Categories" : "Towns"}">
        ${items.map((x) => `<a href="#/${kind}/${x.id}" class="${x.id === id ? "on" : ""}" ${x.id === id ? 'aria-current="page"' : ""}><span>${x.icon}</span>${esc(x.name)}</a>`).join("")}
      </nav>
      <section class="list-main">
        <div class="list-head">
          <h1>${esc(current.name)} <small>${plural(list.length, "item")}</small></h1>
          <label class="sort">Sort by
            <select id="sort">
              ${[["relevance", "Relevance"], ["low", "Price (low to high)"], ["high", "Price (high to low)"], ["discount", "Discount"]]
                .map(([v, l]) => `<option value="${v}" ${v === sortBy ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </label>
        </div>
        ${shops.map((s) => `<a class="shop-strip" href="#/shop/${s.id}"><span class="logo" style="--tone:${s.tone}">${esc(s.name[0])}</span><span><strong>${esc(s.name)}</strong><small>★ ${s.rating} · since ${s.since} · ships in ${s.days} days</small></span><b>›</b></a>`).join("")}
        ${grid(sorted(list))}
      </section>
    </div>`;
  $("sort").addEventListener("change", (e) => { sortBy = e.target.value; listing(kind, id); });
}

function productPage(key) {
  const p = product(key);
  if (!p) return notFound();
  const t = town(p.shop.town);
  const c = CATEGORIES.find((x) => x.id === p.cat);
  const why = blocker(p);
  const pct = off(p);
  view.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/cat/${c.id}">${esc(c.name)}</a> / <span>${esc(p.name)}</span></nav>
    <div class="pdp">
      <div class="pdp-img" style="--tone:${p.shop.tone}"><span>${p.icon}</span>${why ? `<span class="why">${esc(why)}</span>` : ""}</div>
      <div class="pdp-info">
        <h1>${esc(p.name)}</h1>
        <a class="pdp-shop" href="#/shop/${p.shop.id}">${esc(p.shop.name)}, ${esc(t.name)} ›</a>
        <span class="eta">⏱ Ships in ${p.shop.days} days</span>
        <div class="unit-box"><small>Unit</small><strong>${esc(p.unit)}</strong>${priceBlock(p)}${pct ? `<span class="off-tag">${pct}% OFF</span>` : ""}<small>Inclusive of all taxes</small></div>
        <div class="pdp-buy" data-ctl="${p.key}">${control(p.key)}</div>
        ${why ? `<p class="na-note">${esc(why)}. You can still browse the shop's other products.</p>` : ""}
        <h2>Why buy from Hometown Market?</h2>
        <ul class="whys">
          <li><span>🏪</span><div><strong>Straight from the shop</strong><small>No warehouse in between. The shop packs your order itself.</small></div></li>
          <li><span>📦</span><div><strong>Packed to order</strong><small>Made or packed after you order, not taken from old stock.</small></div></li>
          <li><span>✅</span><div><strong>Verified shops</strong><small>Every shop is checked before it can sell. Food shops need an FSSAI licence.</small></div></li>
        </ul>
        <h2>Product details</h2>
        <dl class="details">
          <dt>Shelf life</dt><dd>${esc(p.life)}</dd>
          <dt>Sold by</dt><dd>${esc(p.shop.name)}, ${esc(t.name)}, ${esc(t.state)}</dd>
          <dt>Category</dt><dd>${esc(c.name)}</dd>
        </dl>
      </div>
    </div>
    ${rail(`More from ${p.shop.name}`, sorted(PRODUCTS.filter((x) => x.shop.id === p.shop.id && x.key !== key)))}
    ${rail(`More ${c.name.toLowerCase()}`, sorted(PRODUCTS.filter((x) => x.cat === p.cat && x.shop.id !== p.shop.id)), `#/cat/${c.id}`)}`;
}

function shopPage(id) {
  const s = shop(id);
  if (!s) return notFound();
  const t = town(s.town);
  const closed = s.closedUntil && TODAY < s.closedUntil;
  view.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a> / <a href="#/town/${t.id}">${esc(t.name)}</a> / <span>${esc(s.name)}</span></nav>
    <header class="shop-head" style="--tone:${s.tone}">
      <span class="logo big">${esc(s.name[0])}</span>
      <div>
        <h1>${esc(s.name)}</h1>
        <p>${esc(t.name)}, ${esc(t.state)} · since ${s.since}</p>
        <div class="badges"><span>★ ${s.rating} (${s.reviews.toLocaleString("en-IN")})</span><span>⏱ Ships in ${s.days} days</span><span>✔ Verified</span></div>
      </div>
    </header>
    ${closed ? `<p class="na-note">This shop is closed till ${shortDate(s.closedUntil)}. You can browse but not order.</p>` : ""}
    <p class="story">${esc(s.story)}</p>
    ${grid(sorted(PRODUCTS.filter((p) => p.shop.id === id)))}`;
}

function searchPage(term) {
  const q = norm(term);
  const found = PRODUCTS.filter((p) => {
    const t = town(p.shop.town);
    const c = CATEGORIES.find((x) => x.id === p.cat);
    return norm([p.name, p.shop.name, t.name, t.pin, t.state, t.known, c.name].join(" ")).includes(q);
  });
  if (found.length) {
    view.innerHTML = `<h1 class="page">Showing results for "${esc(term)}"</h1>${grid(sorted(found))}`;
    return;
  }
  const isPin = /^\d{6}$/.test(term.trim());
  view.innerHTML = `
    <div class="no-results">
      <span>🔎</span>
      <h1>${isPin ? `No shops from PIN ${esc(term.trim())} yet` : `Nothing found for "${esc(term)}"`}</h1>
      <p>${isPin ? "We are adding hometowns every week. These are live now:" : "Check the spelling or try a town name. These hometowns are live:"}</p>
      <a class="link" href="#/sell">Know a shop there? Ask them to join</a>
    </div>
    ${tiles()}
    ${rail("Popular right now", sorted(PRODUCTS.filter((p) => p.best)))}`;
}

function orderPage(id) {
  const order = load(ORDERS_KEY, {})[id];
  if (!order) {
    view.innerHTML = `<div class="no-results"><span>📦</span><h1>Order not found</h1><p>Orders are saved on the device they were placed on.</p><a class="cta small" href="#/">Continue shopping</a></div>`;
    return;
  }
  view.innerHTML = `
    <div class="order">
      <div class="order-ok"><span>✅</span><h1>Order placed</h1><p>Order ${esc(id)} · ${new Date(order.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></div>
      <p class="na-note">Prototype: no payment was taken and no shop was told about this order.</p>
      ${order.groups.map((g) => `
        <section class="box">
          <h2>${esc(g.shop)} <small>arrives in about ${g.days} days</small></h2>
          ${g.items.map((i) => `<p class="row"><span>${i.qty} × ${esc(i.name)} (${esc(i.unit)})</span><span>${rupees(i.qty * i.price)}</span></p>`).join("")}
        </section>`).join("")}
      <section class="box">
        <p class="row"><span>Items</span><span>${rupees(order.items)}</span></p>
        <p class="row"><span>Delivery</span><span>${rupees(order.delivery)}</span></p>
        <p class="row grand"><span>Paid on delivery</span><span>${rupees(order.items + order.delivery)}</span></p>
      </section>
      <section class="box"><h2>Delivering to</h2><p>${esc(order.address.name)}, ${esc(order.address.phone)}<br>${esc(order.address.line)}, ${esc(order.address.city)} ${esc(order.address.pin)}</p></section>
      <a class="cta" href="#/">Continue shopping</a>
    </div>`;
}

function sellPage() {
  view.innerHTML = `
    <div class="sell">
      <h1 class="page">Sell on Hometown Market</h1>
      <p>List your shop free. We never buy your stock or hold it in a warehouse: you sell directly to the customer.</p>
      <form id="sell" class="form" novalidate>
        <label>Shop name<input name="shop" autocomplete="organization"><small class="err" data-err="shop"></small></label>
        <label>Owner name<input name="owner" autocomplete="name"><small class="err" data-err="owner"></small></label>
        <label>Town<input name="town"><small class="err" data-err="town"></small></label>
        <label>PIN code<input name="pin" inputmode="numeric" maxlength="6"><small class="err" data-err="pin"></small></label>
        <label>Mobile number<input name="phone" type="tel" autocomplete="tel"><small class="err" data-err="phone"></small></label>
        <fieldset><legend>What do you sell?</legend>
          <label class="radio"><input type="radio" name="kind" value="food" checked> Food (sweets, namkeen)</label>
          <label class="radio"><input type="radio" name="kind" value="other"> Non food (crafts, toys)</label>
        </fieldset>
        <label id="fssai-row">FSSAI licence number<input name="fssai" inputmode="numeric" maxlength="14"><small class="err" data-err="fssai"></small></label>
        <label>Your products<textarea name="items" rows="3" placeholder="For example: peda, milk cake, gift boxes"></textarea><small class="err" data-err="items"></small></label>
        <p class="err form-err" role="alert"></p>
        <button class="cta">Send for verification</button>
      </form>
    </div>`;
  const form = $("sell");
  const syncKind = () => { $("fssai-row").hidden = form.kind.value !== "food"; };
  form.addEventListener("change", syncKind);
  form.addEventListener("submit", submitSignup);
}

async function submitSignup(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const phone = cleanPhone(data.phone || "");
  const errors = {
    shop: (data.shop || "").trim().length < 2 && "Enter your shop name",
    owner: (data.owner || "").trim().length < 2 && "Enter the owner's name",
    town: (data.town || "").trim().length < 2 && "Enter your town",
    pin: !validPin(data.pin || "") && "Enter a 6 digit PIN code that does not start with 0",
    phone: !validPhone(data.phone || "") && "Enter a 10 digit mobile number starting with 6, 7, 8 or 9",
    fssai: data.kind === "food" && !/^\d{14}$/.test((data.fssai || "").replace(/\s/g, "")) && "Food shops need a 14 digit FSSAI licence number",
    items: (data.items || "").trim().length < 3 && "Tell us what you sell",
  };
  if (showErrors(form, errors)) return;
  const formErr = form.querySelector(".form-err");
  if (load(SIGNUPS_KEY, []).includes(phone)) {
    formErr.textContent = "This mobile number has already applied. We will call you soon.";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Sending...";
  try {
    if (SIGNUP_URL) {
      if (!navigator.onLine) throw new Error("offline");
      const res = await fetch(SIGNUP_URL, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...data, phone }) });
      if (!res.ok) throw new Error(`status ${res.status}`);
    }
  } catch {
    formErr.textContent = "Could not send. Check your internet connection and try again.";
    button.disabled = false;
    button.textContent = "Send for verification";
    return;
  }
  store(SIGNUPS_KEY, [...load(SIGNUPS_KEY, []), phone]);
  view.innerHTML = `<div class="no-results"><span>🏪</span><h1>Thank you</h1><p>${esc(data.shop)} is in the queue for verification.${SIGNUP_URL ? " We will call you within two working days." : " This prototype does not send the form anywhere yet."}</p><a class="cta small" href="#/">Back to shopping</a></div>`;
}

const cleanPhone = (v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, "");
const validPhone = (v) => /^[6-9]\d{9}$/.test(cleanPhone(v));
const validPin = (v) => /^[1-9]\d{5}$/.test(v.trim());

// Writes each message under its field; returns true when any field failed
function showErrors(form, errors) {
  Object.entries(errors).forEach(([name, msg]) => {
    const slot = form.querySelector(`[data-err="${name}"]`);
    const input = form.elements[name];
    if (slot) slot.textContent = msg || "";
    if (input && input.setAttribute) input.setAttribute("aria-invalid", msg ? "true" : "false");
  });
  const first = Object.keys(errors).find((k) => errors[k]);
  if (first && form.elements[first] && form.elements[first].focus) form.elements[first].focus();
  return Boolean(first);
}

function notFound() {
  view.innerHTML = `<div class="no-results"><span>🧭</span><h1>Page not found</h1><a class="cta small" href="#/">Back to shopping</a></div>`;
}

/* Cart drawer */

function openDrawer() {
  drawerStep = "cart";
  drawer.hidden = false;
  $("scrim").hidden = false;
  document.body.classList.add("locked");
  drawDrawer();
  drawCartButtons();
}

function closeDrawer() {
  drawer.hidden = true;
  $("scrim").hidden = true;
  document.body.classList.remove("locked");
  drawCartButtons();
  $("cart-btn").focus();
}

function drawDrawer() {
  if (drawerStep === "address") return drawAddress();
  const head = `<header class="d-head"><h2>My Cart</h2><button class="x" data-close aria-label="Close cart">✕</button></header>`;
  if (!count()) {
    drawer.innerHTML = `${head}<div class="d-empty"><span>🛒</span><h3>You don't have any items in your cart</h3><p>Your favourite hometown items are waiting for you</p><button class="cta small" data-close>Start shopping</button></div>`;
    drawer.querySelector(".x").focus();
    return;
  }
  const items = itemTotal();
  const saved = mrpTotal() - items;
  const groups = byShop();
  const delivery = groups.length * DELIVERY_PER_SHOP;
  drawer.innerHTML = `${head}
    <div class="d-body">
      ${saved > 0 ? `<p class="saving">Your total savings <b>${rupees(saved)}</b></p>` : ""}
      ${groups.map((g) => `
        <section class="box">
          <div class="ship"><span>⏱</span><div><strong>Delivery in ${g.s.days} days</strong><small>From ${esc(g.s.name)}, ${esc(town(g.s.town).name)} · ${plural(g.items.reduce((a, l) => a + l.qty, 0), "item")}</small></div></div>
          ${g.items.map((l) => `
            <div class="line">
              <span class="mini" style="--tone:${g.s.tone}">${l.p.icon}</span>
              <div><strong>${esc(l.p.name)}</strong><small>${esc(l.p.unit)}</small>${priceBlock(l.p)}</div>
              <div data-ctl="${l.p.key}">${control(l.p.key)}</div>
            </div>`).join("")}
        </section>`).join("")}
      <section class="box bill">
        <h3>Bill details</h3>
        <p class="row"><span>📄 Items total</span><span>${saved > 0 ? `<s>${rupees(mrpTotal())}</s> ` : ""}${rupees(items)}</span></p>
        <p class="row"><span>🚚 Delivery charge <small>(${plural(groups.length, "shop")} × ${rupees(DELIVERY_PER_SHOP)})</small></span><span>${rupees(delivery)}</span></p>
        <p class="row grand"><span>Grand total</span><span>${rupees(items + delivery)}</span></p>
      </section>
      <section class="box note"><h3>Good to know</h3><p>Each shop packs and ships its own parcel, so items from different shops arrive separately. We deliver within India only for now.</p></section>
    </div>
    <footer class="d-foot"><button class="proceed" id="proceed"><span><b>${rupees(items + delivery)}</b><small>TOTAL</small></span><span>Proceed ›</span></button></footer>`;
  $("proceed").addEventListener("click", () => { drawerStep = "address"; drawDrawer(); });
}

function drawAddress() {
  const a = load(ADDRESS_KEY, {});
  const v = (k) => esc(a[k] || "");
  drawer.innerHTML = `
    <header class="d-head"><button class="x" id="back" aria-label="Back to cart">‹</button><h2>Delivery address</h2><button class="x" data-close aria-label="Close cart">✕</button></header>
    <form id="addr" class="form d-body" novalidate>
      <label>Full name<input name="name" autocomplete="name" value="${v("name")}"><small class="err" data-err="name"></small></label>
      <label>Mobile number<input name="phone" type="tel" autocomplete="tel" value="${v("phone")}"><small class="err" data-err="phone"></small></label>
      <label>House, street and area<input name="line" autocomplete="street-address" value="${v("line")}"><small class="err" data-err="line"></small></label>
      <label>City<input name="city" autocomplete="address-level2" value="${v("city")}"><small class="err" data-err="city"></small></label>
      <label>PIN code<input name="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="${v("pin")}"><small class="err" data-err="pin"></small></label>
      <p class="hint">India only for now. Payment is cash on delivery in this prototype.</p>
      <p class="err form-err" role="alert"></p>
    </form>
    <footer class="d-foot"><button class="proceed" form="addr" id="place"><span><b>${rupees(itemTotal() + byShop().length * DELIVERY_PER_SHOP)}</b><small>TOTAL</small></span><span>Place order ›</span></button></footer>`;
  $("back").addEventListener("click", () => { drawerStep = "cart"; drawDrawer(); });
  $("addr").addEventListener("submit", placeOrder);
  $("addr").elements.name.focus();
}

function placeOrder(e) {
  e.preventDefault();
  const form = e.target;
  const place = $("place");
  if (place.disabled) return;
  const data = Object.fromEntries(new FormData(form));
  const errors = {
    name: (data.name || "").trim().length < 2 && "Enter the name of the person receiving the order",
    phone: !validPhone(data.phone || "") && "Enter a 10 digit mobile number starting with 6, 7, 8 or 9",
    line: (data.line || "").trim().length < 6 && "Enter the house number, street and area",
    city: (data.city || "").trim().length < 2 && "Enter the city",
    pin: !validPin(data.pin || "") && "Enter a 6 digit PIN code that does not start with 0",
  };
  if (showErrors(form, errors)) return;
  // The cart may have changed in another tab or a shop may have closed since it was filled
  const fresh = cleanCart(load(CART_KEY, {}));
  cart = fresh.cart;
  if (fresh.dropped.length || !count()) {
    store(CART_KEY, cart);
    drawerStep = "cart";
    drawDrawer();
    drawCartButtons();
    return toast(count() ? removedMsg(fresh.dropped, "") : "Your cart is empty");
  }
  place.disabled = true;
  const address = { ...data, phone: cleanPhone(data.phone), pin: data.pin.trim() };
  const groups = byShop().map((g) => ({ shop: g.s.name, days: g.s.days, items: g.items.map((l) => ({ name: l.p.name, unit: l.p.unit, price: l.p.price, qty: l.qty })) }));
  const id = `HM${Date.now().toString(36).toUpperCase()}`;
  const order = { at: Date.now(), address, groups, items: itemTotal(), delivery: groups.length * DELIVERY_PER_SHOP };
  store(ORDERS_KEY, { ...load(ORDERS_KEY, {}), [id]: order });
  store(ADDRESS_KEY, address);
  cart = {};
  store(CART_KEY, cart);
  closeDrawer();
  location.hash = `#/order/${id}`;
}

function drawCartButtons() {
  const n = count();
  const total = itemTotal();
  $("cart-btn").innerHTML = n ? `🛒 <span class="two"><b>${plural(n, "item")}</b>${rupees(total)}</span>` : `🛒 <span>My Cart</span>`;
  $("cart-btn").setAttribute("aria-label", n ? `Cart, ${plural(n, "item")}, ${rupees(total)}` : "Cart, empty");
  const bar = $("cart-bar");
  bar.hidden = !n || !drawer.hidden;
  bar.innerHTML = `<span class="bag">🛒</span><span class="two"><b>${plural(n, "item")}</b>${rupees(total)}</span><span>View cart ›</span>`;
}

/* Events and routing */

document.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (inc) setQty(inc.dataset.inc, (cart[inc.dataset.inc] || 0) + 1);
  if (dec) setQty(dec.dataset.dec, (cart[dec.dataset.dec] || 0) - 1);
  if (e.target.closest("[data-close]")) closeDrawer();
});
$("cart-btn").addEventListener("click", openDrawer);
$("cart-bar").addEventListener("click", openDrawer);
$("scrim").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) closeDrawer(); });

search.addEventListener("input", () => {
  const term = search.value.trim();
  location.replace(term ? `#/search/${encodeURIComponent(term)}` : "#/");
});
$("search").addEventListener("submit", (e) => { e.preventDefault(); search.blur(); });

// Another tab changed the cart: take its copy and redraw
window.addEventListener("storage", (e) => {
  if (e.key !== CART_KEY) return;
  cart = cleanCart(load(CART_KEY, {})).cart;
  route(false);
  if (!drawer.hidden && drawerStep === "cart") drawDrawer();
});

function route(scroll = true) {
  const [, page, a = "", b = ""] = location.hash.split("/");
  const pages = {
    cat: () => listing("cat", a), town: () => listing("town", a), shop: () => shopPage(a),
    p: () => productPage(`${a}/${b}`), search: () => searchPage(safeDecode(a)),
    order: () => orderPage(a), sell: sellPage,
  };
  (pages[page] || home)();
  if (page !== "search") search.value = "";
  else if (document.activeElement !== search) search.value = safeDecode(a);
  drawCartButtons();
  if (scroll && page !== "search") window.scrollTo(0, 0);
}

window.addEventListener("hashchange", () => route());
route();
if (droppedOnLoad.length) toast(removedMsg(droppedOnLoad, " from your cart"));
