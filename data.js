// Sample towns, shops and products for the prototype. Shop names and ratings are made up.
// closedUntil hides a shop until that date. stock: 0 marks a product sold out.
const TOWNS = [
  { id: "mathura", name: "Mathura", state: "Uttar Pradesh", pin: "281001", known: "Peda", icon: "temple" },
  { id: "agra", name: "Agra", state: "Uttar Pradesh", pin: "282001", known: "Petha", icon: "dome" },
  { id: "bikaner", name: "Bikaner", state: "Rajasthan", pin: "334001", known: "Bhujia", icon: "fort" },
  { id: "dharwad", name: "Dharwad", state: "Karnataka", pin: "580001", known: "Pedha", icon: "wheat" },
  { id: "tirunelveli", name: "Tirunelveli", state: "Tamil Nadu", pin: "627001", known: "Halwa", icon: "palm" },
  { id: "channapatna", name: "Channapatna", state: "Karnataka", pin: "562160", known: "Wooden toys", icon: "horse" },
];

const CATEGORIES = [
  { id: "sweets", name: "Sweets", icon: "sweets" },
  { id: "namkeen", name: "Namkeen", icon: "namkeen" },
  { id: "gifts", name: "Gift boxes", icon: "gifts" },
  { id: "crafts", name: "Toys and crafts", icon: "crafts" },
];

const SHOPS = [
  {
    id: "brij-peda-ghar", town: "mathura", name: "Brij Peda Ghar", since: 1962, tone: "#e8590c",
    rating: 4.6, reviews: 2140, days: 3,
    story: "Three generations have stirred khoa in the same iron kadhai near the ghats. The peda is browned slowly over wood fire.",
    products: [
      { id: "p1", name: "Mathura peda", unit: "500 g", price: 320, mrp: 360, life: "15 days", cat: "sweets", icon: "🟤", best: true },
      { id: "p2", name: "Kesar peda", unit: "500 g", price: 420, mrp: 480, life: "15 days", cat: "sweets", icon: "🟠" },
      { id: "p3", name: "Peda gift box, mixed", unit: "1 kg", price: 780, mrp: 900, life: "15 days", cat: "gifts", icon: "🎁", best: true },
    ],
  },
  {
    id: "yamuna-sweets", town: "mathura", name: "Yamuna Sweets", since: 1988, tone: "#c2255c",
    rating: 4.3, reviews: 860, days: 3,
    story: "A small counter shop known for milk cake that sells out before noon on festival days.",
    products: [
      { id: "p1", name: "Milk cake", unit: "500 g", price: 300, mrp: 330, life: "10 days", cat: "sweets", icon: "🍰" },
      { id: "p2", name: "Rabri peda", unit: "500 g", price: 360, mrp: 360, life: "12 days", cat: "sweets", icon: "🍮" },
    ],
  },
  {
    id: "taj-petha-bhandar", town: "agra", name: "Taj Petha Bhandar", since: 1951, tone: "#2b8a3e",
    rating: 4.5, reviews: 3310, days: 2,
    story: "Ash gourd cut by hand every morning and cooked in sugar syrup the old way. Twelve kinds on the shelf.",
    products: [
      { id: "p1", name: "Classic white petha", unit: "1 kg", price: 260, mrp: 300, life: "30 days", cat: "sweets", icon: "🧊", best: true },
      { id: "p2", name: "Angoori petha", unit: "500 g", price: 220, mrp: 240, life: "20 days", cat: "sweets", icon: "🍇" },
      { id: "p3", name: "Paan petha", unit: "500 g", price: 280, mrp: 320, life: "20 days", stock: 0, cat: "sweets", icon: "🍃" },
    ],
  },
  {
    id: "marwar-namkeen", town: "bikaner", name: "Marwar Namkeen", since: 1970, tone: "#e67700",
    rating: 4.7, reviews: 5120, days: 4,
    story: "Moth bean flour and desert spices, fried fresh in small batches. Packed the same day it is made.",
    products: [
      { id: "p1", name: "Bikaneri bhujia", unit: "1 kg", price: 340, mrp: 400, life: "90 days", cat: "namkeen", icon: "🥨", best: true },
      { id: "p2", name: "Papad, hand rolled", unit: "500 g", price: 190, mrp: 210, life: "180 days", cat: "namkeen", icon: "🫓" },
      { id: "p3", name: "Rasgulla tin", unit: "1 kg", price: 250, mrp: 280, life: "180 days", cat: "sweets", icon: "⚪" },
    ],
  },
  {
    id: "sharada-pedha", town: "dharwad", name: "Sharada Pedha House", since: 1933, tone: "#862e9c",
    rating: 4.8, reviews: 4470, days: 3,
    story: "Caramelised milk pedha rolled in sugar, made to a recipe the family brought to Dharwad ninety years ago.",
    products: [
      { id: "p1", name: "Dharwad pedha", unit: "500 g", price: 300, mrp: 340, life: "20 days", cat: "sweets", icon: "🟫", best: true },
      { id: "p2", name: "Kunda", unit: "500 g", price: 280, mrp: 280, life: "5 days", cat: "sweets", icon: "🍫" },
    ],
  },
  {
    id: "nellai-halwa", town: "tirunelveli", name: "Nellai Halwa Kadai", since: 1945, tone: "#c92a2a",
    rating: 4.6, reviews: 2890, days: 5, closedUntil: "2026-11-03",
    story: "Wheat milk, ghee and Thamirabarani water. The halwa is stirred for hours until it shines.",
    products: [
      { id: "p1", name: "Tirunelveli halwa", unit: "500 g", price: 350, mrp: 400, life: "30 days", cat: "sweets", icon: "🟥", best: true },
      { id: "p2", name: "Cashew halwa", unit: "500 g", price: 450, mrp: 520, life: "30 days", cat: "sweets", icon: "🥜" },
    ],
  },
  {
    id: "lac-toy-works", town: "channapatna", name: "Lac Toy Works", since: 1979, tone: "#1971c2",
    rating: 4.4, reviews: 970, days: 5,
    story: "Ivory wood turned on a lathe and coloured with natural lac. Every toy is safe for small hands.",
    products: [
      { id: "p1", name: "Spinning top set", unit: "set of 4", price: 450, mrp: 550, life: "Non food", cat: "crafts", icon: "🪀", best: true },
      { id: "p2", name: "Rocking horse", unit: "1 piece", price: 1200, mrp: 1500, life: "Non food", cat: "crafts", icon: "🐴" },
      { id: "p3", name: "Stacking rings", unit: "1 piece", price: 380, mrp: 420, life: "Non food", cat: "crafts", icon: "🎯" },
    ],
  },
];
