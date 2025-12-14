import { apiGet } from "./shopifyApi.js";

const grid = document.querySelector("[data-products-grid]");

function money(amount, code) {
  const n = Number(amount);
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(n); }
  catch { return `${n.toFixed(2)} ${code}`; }
}

function card(p) {
  const price = p.priceRange?.minVariantPrice;
  const img = p.featuredImage?.url;
  return `
    <a class="g-card" href="/shop/${p.handle}">
      <div class="g-card__img">${img ? `<img src="${img}" alt="${p.featuredImage?.altText ?? p.title}">` : ""}</div>
      <div class="g-card__body">
        <div class="g-card__title">${p.title}</div>
        ${price ? `<div class="g-card__price">${money(price.amount, price.currencyCode)}</div>` : ""}
      </div>
    </a>
  `;
}

(async () => {
  const products = await apiGet("/api/shopify/products");
  grid.innerHTML = products.map(card).join("");
})();
