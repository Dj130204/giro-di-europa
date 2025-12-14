import { apiGet } from "./shopifyApi.js";
import { addToCart, ensureCheckout } from "./cart.js";

const handle = document.body.dataset.handle;
const titleEl = document.querySelector("[data-p-title]");
const descEl  = document.querySelector("[data-p-desc]");
const imgEl   = document.querySelector("[data-p-img]");
const variantSel = document.querySelector("[data-p-variant]");
const priceEl = document.querySelector("[data-p-price]");
const addBtn  = document.querySelector("[data-add]");
const cartBtn = document.querySelector("[data-open-cart]");

function money(amount, code) {
  const n = Number(amount);
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(n); }
  catch { return `${n.toFixed(2)} ${code}`; }
}

let product;

function render() {
  titleEl.textContent = product.title;
  descEl.innerHTML = product.descriptionHtml || "";
  if (product.featuredImage?.url) imgEl.src = product.featuredImage.url;

  variantSel.innerHTML = product.variants.nodes.map(v => (
    `<option value="${v.id}" ${!v.availableForSale ? "disabled" : ""}>${v.title}${!v.availableForSale ? " (Sold out)" : ""}</option>`
  )).join("");

  updatePrice();
}

function updatePrice() {
  const id = variantSel.value;
  const v = product.variants.nodes.find(x => x.id === id);
  if (!v) return;
  priceEl.textContent = money(v.price.amount, v.price.currencyCode);
  addBtn.disabled = !v.availableForSale;
}

(async () => {
  product = await apiGet(`/api/shopify/products/${encodeURIComponent(handle)}`);
  render();
  await ensureCheckout();
})();

variantSel.addEventListener("change", updatePrice);

addBtn.addEventListener("click", async () => {
  addBtn.disabled = true;
  await addToCart(variantSel.value, 1);
  addBtn.disabled = false;
  cartBtn?.click();
});
