# Hometown Market

A prototype marketplace where hometown shops sell their own products directly to customers. The platform holds no stock and runs no warehouses.

Live site: https://ankurnapa.github.io/hometown-market/

## What works

- Browse by category or hometown, with sorting and product pages
- Search by product, town or PIN code, with spelling variants such as pedha for peda
- Cart drawer grouped by shop, delivery charged per shop, up to 10 of each item
- Checkout with address, phone and PIN checks, saved orders with an order page
- Vendor sign up with FSSAI required for food shops
- Closed shops, sold out items and foods that would spoil in transit cannot be ordered

## Edge case checks

    ./checks.sh                                      # local server on port 8811
    ./checks.sh https://ankurnapa.github.io/hometown-market/

Set `SIGNUP_URL` in `app.js` to a Formspree form URL to receive vendor sign ups.

## What is not built yet

Payments, real orders, delivery and vendor accounts need a backend. Every shop on the site is sample data.

## Run locally

    python3 -m http.server 8811

Shops and towns live in `data.js`.
