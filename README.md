# Hometown Market

A prototype marketplace where hometown shops sell their own products directly to customers. The platform holds no stock and runs no warehouses.

Live site: https://ankurnapa.github.io/hometown-market/

## What works

- Search shops by town, PIN code or shop name
- Browse towns and shop pages with each shop's story
- Basket with quantities and a total, kept in the browser
- Vendor sign up form with PIN, phone and FSSAI checks

## What is not built yet

Payments, real orders, delivery and vendor accounts need a backend. Every shop on the site is sample data.

## Run locally

    python3 -m http.server 8811

Shops and towns live in `data.js`.
