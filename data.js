// Sample towns and shops for the prototype. Shop names are made up.
const TOWNS = [
  { id: "mathura", name: "Mathura", state: "Uttar Pradesh", pin: "281001", known: "Peda" },
  { id: "agra", name: "Agra", state: "Uttar Pradesh", pin: "282001", known: "Petha" },
  { id: "bikaner", name: "Bikaner", state: "Rajasthan", pin: "334001", known: "Bhujia" },
  { id: "dharwad", name: "Dharwad", state: "Karnataka", pin: "580001", known: "Pedha" },
  { id: "tirunelveli", name: "Tirunelveli", state: "Tamil Nadu", pin: "627001", known: "Halwa" },
  { id: "channapatna", name: "Channapatna", state: "Karnataka", pin: "562160", known: "Wooden toys" },
];

const SHOPS = [
  {
    id: "brij-peda-ghar", town: "mathura", name: "Brij Peda Ghar", since: 1962, tone: "#b5532c",
    story: "Three generations have stirred khoa in the same iron kadhai near the ghats. The peda is browned slowly over wood fire.",
    products: [
      { id: "p1", name: "Mathura peda", unit: "500 g", price: 320, life: "15 days" },
      { id: "p2", name: "Kesar peda", unit: "500 g", price: 420, life: "15 days" },
      { id: "p3", name: "Gift box, mixed", unit: "1 kg", price: 780, life: "15 days" },
    ],
  },
  {
    id: "yamuna-sweets", town: "mathura", name: "Yamuna Sweets", since: 1988, tone: "#8a6a1f",
    story: "A small counter shop known for milk cake that sells out before noon on festival days.",
    products: [
      { id: "p1", name: "Milk cake", unit: "500 g", price: 300, life: "10 days" },
      { id: "p2", name: "Rabri peda", unit: "500 g", price: 360, life: "12 days" },
    ],
  },
  {
    id: "taj-petha-bhandar", town: "agra", name: "Taj Petha Bhandar", since: 1951, tone: "#4f7a3a",
    story: "Ash gourd cut by hand every morning and cooked in sugar syrup the old way. Twelve kinds on the shelf.",
    products: [
      { id: "p1", name: "Classic white petha", unit: "1 kg", price: 260, life: "30 days" },
      { id: "p2", name: "Angoori petha", unit: "500 g", price: 220, life: "20 days" },
      { id: "p3", name: "Paan petha", unit: "500 g", price: 280, life: "20 days" },
    ],
  },
  {
    id: "marwar-namkeen", town: "bikaner", name: "Marwar Namkeen", since: 1970, tone: "#c08a2e",
    story: "Moth bean flour and desert spices, fried fresh in small batches. Packed the same day it is made.",
    products: [
      { id: "p1", name: "Bikaneri bhujia", unit: "1 kg", price: 340, life: "90 days" },
      { id: "p2", name: "Papad, hand rolled", unit: "500 g", price: 190, life: "180 days" },
      { id: "p3", name: "Rasgulla tin", unit: "1 kg", price: 250, life: "180 days" },
    ],
  },
  {
    id: "thakur-pedha", town: "dharwad", name: "Thakur Pedha Stores", since: 1933, tone: "#6b3f2a",
    story: "Caramelised milk pedha rolled in sugar, made to a recipe the family brought to Dharwad ninety years ago.",
    products: [
      { id: "p1", name: "Dharwad pedha", unit: "500 g", price: 300, life: "20 days" },
      { id: "p2", name: "Kunda", unit: "500 g", price: 280, life: "7 days" },
    ],
  },
  {
    id: "nellai-halwa", town: "tirunelveli", name: "Nellai Halwa Kadai", since: 1945, tone: "#9c2f2f",
    story: "Wheat milk, ghee and Thamirabarani water. The halwa is stirred for hours until it shines.",
    products: [
      { id: "p1", name: "Tirunelveli halwa", unit: "500 g", price: 350, life: "30 days" },
      { id: "p2", name: "Cashew halwa", unit: "500 g", price: 450, life: "30 days" },
    ],
  },
  {
    id: "lac-toy-works", town: "channapatna", name: "Lac Toy Works", since: 1979, tone: "#2f6b75",
    story: "Ivory wood turned on a lathe and coloured with natural lac. Every toy is safe for small hands.",
    products: [
      { id: "p1", name: "Spinning top set", unit: "set of 4", price: 450, life: "Non food" },
      { id: "p2", name: "Rocking horse", unit: "1 piece", price: 1200, life: "Non food" },
      { id: "p3", name: "Stacking rings", unit: "1 piece", price: 380, life: "Non food" },
    ],
  },
];
