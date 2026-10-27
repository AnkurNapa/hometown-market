#!/bin/zsh
# Drives every user flow in gstack's headless browser and fails on the first wrong result.
# Usage: ./checks.sh [url]   (defaults to a local server on port 8811)
URL=${1:-http://localhost:8811/}
B="$HOME/.claude/skills/gstack/browse/dist/browse"
fails=0

js() { $B js "$1" 2>/dev/null | tail -1; }
check() {
  local name=$1 want=$2 got=$3
  if [[ "$got" == "$want" ]]; then print "PASS  $name"; else print "FAIL  $name: wanted [$want] got [$got]"; fails=$((fails+1)); fi
}
fresh() { $B goto "$URL" >/dev/null; js 'localStorage.clear(); location.hash="#/"; location.reload(); 1' >/dev/null; sleep 0.5; }

$B viewport 1280x900 >/dev/null
fresh

# Flow 1: browse and add
js 'document.querySelector(".grid [data-inc], .rail [data-inc]").click(); 1' >/dev/null
check "ADD turns into stepper" "1" "$(js 'document.querySelector(".stepper span").textContent')"
check "Cart button shows count" "1 item" "$(js 'document.querySelector("#cart-btn b").textContent')"
js 'for (let i = 0; i < 15; i++) document.querySelector(".stepper [data-inc]").click(); 1' >/dev/null
check "Quantity capped at 10" "10" "$(js 'document.querySelector(".stepper span").textContent')"
check "Sold out product cannot be added" "true" "$(js 'location.hash="#/p/taj-petha-bhandar/p3"; 1' >/dev/null; sleep 0.3; js 'document.querySelector(".pdp-buy .add").disabled')"
check "Closed shop product cannot be added" "true" "$(js 'location.hash="#/p/nellai-halwa/p1"; 1' >/dev/null; sleep 0.3; js 'document.querySelector(".pdp-buy .add").disabled')"
check "Short shelf life product cannot be added" "true" "$(js 'location.hash="#/p/sharada-pedha/p2"; 1' >/dev/null; sleep 0.3; js 'document.querySelector(".pdp-buy .add").disabled')"

# Saved cart with junk: unknown item, blocked item, bad numbers
js 'localStorage.setItem("hometown-cart", JSON.stringify({"gone/p9": 2, "taj-petha-bhandar/p3": 1, "marwar-namkeen/p1": "abc", "marwar-namkeen/p2": 99, "brij-peda-ghar/p1": -4})); location.reload(); 1' >/dev/null; sleep 0.6
check "Junk cart cleaned to one valid line" '{"marwar-namkeen/p2":10}' "$(js 'localStorage.getItem("hometown-cart")')"
check "Removed items are announced" "true" "$(js '!document.getElementById("toast").hidden && document.getElementById("toast").textContent.includes("were removed")')"
js 'localStorage.setItem("hometown-cart", "not json"); location.reload(); 1' >/dev/null; sleep 0.5
check "Corrupt cart storage gives empty cart" "Cart, empty" "$(js 'document.getElementById("cart-btn").getAttribute("aria-label")')"

# Flow 2: search
fresh
js 'const q = document.getElementById("q"); q.value = "pedha"; q.dispatchEvent(new Event("input")); 1' >/dev/null; sleep 0.3
check "Spelling variant pedha finds peda" "true" "$(js 'document.querySelectorAll(".grid .card").length > 3')"
js 'const q = document.getElementById("q"); q.value = "560001"; q.dispatchEvent(new Event("input")); 1' >/dev/null; sleep 0.3
check "Unknown PIN gets a clear message" "No shops from PIN 560001 yet" "$(js 'document.querySelector(".no-results h1").textContent')"
js 'location.hash = "#/search/%E0%A4"; 1' >/dev/null; sleep 0.3
check "Broken search code does not crash" "true" "$(js 'document.querySelector("main").children.length > 0')"
js 'location.hash = "#/cat/sweets"; 1' >/dev/null; sleep 0.3
check "Search box clears on other pages" "" "$(js 'document.getElementById("q").value')"
js 'document.getElementById("sort").value = "low"; document.getElementById("sort").dispatchEvent(new Event("change")); 1' >/dev/null
check "Sort low to high puts cheapest first" "₹220" "$(js 'document.querySelector(".grid .price").firstChild.textContent')"
js 'location.hash = "#/shop/nope"; 1' >/dev/null; sleep 0.3
check "Unknown shop shows not found" "Page not found" "$(js 'document.querySelector(".no-results h1").textContent')"

# Flow 3: cart and checkout
fresh
js 'location.hash = "#/p/brij-peda-ghar/p1"; 1' >/dev/null; sleep 0.3
js 'document.querySelector(".pdp-buy .add").click(); location.hash = "#/p/marwar-namkeen/p1"; 1' >/dev/null; sleep 0.3
js 'document.querySelector(".pdp-buy .add").click(); document.getElementById("cart-btn").click(); 1' >/dev/null; sleep 0.3
check "Cart groups items by shop" "2" "$(js 'document.querySelectorAll("#drawer .ship").length')"
check "Delivery charged per shop" "₹98" "$(js '[...document.querySelectorAll("#drawer .row")][1].lastElementChild.textContent')"
js 'document.getElementById("proceed").click(); 1' >/dev/null; sleep 0.2
js 'const f = document.getElementById("addr"); f.name.value = "Asha"; f.phone.value = "12345"; f.line.value = "12 MG Road, Indiranagar"; f.city.value = "Bengaluru"; f.pin.value = "012345"; f.requestSubmit(); 1' >/dev/null
check "Bad phone is rejected" "true" "$(js 'document.querySelector("[data-err=phone]").textContent.length > 0')"
check "PIN starting with 0 is rejected" "true" "$(js 'document.querySelector("[data-err=pin]").textContent.length > 0')"
js 'localStorage.setItem("hometown-cart", JSON.stringify({"brij-peda-ghar/p1": 1})); 1' >/dev/null
js 'const f = document.getElementById("addr"); f.phone.value = "+91 98765 43210"; f.pin.value = "560038"; f.requestSubmit(); f.requestSubmit(); 1' >/dev/null; sleep 0.4
check "Order placed with phone in +91 format" "true" "$(js 'location.hash.startsWith("#/order/HM")')"
check "Order uses the latest cart from storage" "1" "$(js 'document.querySelectorAll(".order .box h2").length - 1')"
check "Double tap made one order" "1" "$(js 'Object.keys(JSON.parse(localStorage.getItem("hometown-orders"))).length')"
check "Cart empty after order" "Cart, empty" "$(js 'document.getElementById("cart-btn").getAttribute("aria-label")')"
js 'location.reload(); 1' >/dev/null; sleep 0.5
check "Order page survives a reload" "Order placed" "$(js 'document.querySelector(".order-ok h1").textContent')"
js 'location.hash = "#/order/NOPE"; 1' >/dev/null; sleep 0.3
check "Unknown order id handled" "Order not found" "$(js 'document.querySelector(".no-results h1").textContent')"

# Flow 4: vendor sign up
fresh
js 'location.hash = "#/sell"; 1' >/dev/null; sleep 0.3
js 'const f = document.getElementById("sell"); f.shop.value = "Test Sweets"; f.owner.value = "Ravi"; f.town.value = "Mathura"; f.pin.value = "281001"; f.phone.value = "98765 43210"; f.items.value = "peda"; f.requestSubmit(); 1' >/dev/null
check "Food shop without FSSAI is rejected" "true" "$(js 'document.querySelector("[data-err=fssai]").textContent.length > 0')"
js 'const f = document.getElementById("sell"); f.querySelector("[value=other]").click(); f.requestSubmit(); 1' >/dev/null; sleep 0.3
check "Non food shop signs up without FSSAI" "Thank you" "$(js 'document.querySelector(".no-results h1").textContent')"
js 'location.hash = "#/"; location.hash = "#/sell"; 1' >/dev/null; sleep 0.3
js 'const f = document.getElementById("sell"); f.shop.value = "Test Sweets"; f.owner.value = "Ravi"; f.town.value = "Mathura"; f.pin.value = "281001"; f.phone.value = "+919876543210"; f.items.value = "peda"; f.querySelector("[value=other]").click(); f.requestSubmit(); 1' >/dev/null; sleep 0.3
check "Same phone cannot apply twice" "true" "$(js 'document.querySelector(".form-err").textContent.includes("already applied")')"

# Layout and errors
for w in 375 768 1280; do
  $B viewport ${w}x900 >/dev/null; $B goto "$URL" >/dev/null; sleep 0.3
  check "No sideways scroll at ${w}px" "$w" "$(js 'document.documentElement.scrollWidth')"
done
check "No console errors" "0" "$($B console --errors 2>/dev/null | grep -vcE 'no console errors|UNTRUSTED|^$')"

print "\n$fails failed"
exit $fails
