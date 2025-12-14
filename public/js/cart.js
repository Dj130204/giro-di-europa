import { apiGet, apiPost } from "./shopifyApi.js";

const KEY = "giro_checkout_id";

export function getCheckoutId() {
  return localStorage.getItem(KEY);
}

export function setCheckoutId(id) {
  localStorage.setItem(KEY, id);
}

export async function ensureCheckout() {
  const id = getCheckoutId();
  if (id) {
    try {
      const checkout = await apiGet(`/api/shopify/checkout/${encodeURIComponent(id)}`);
      if (checkout?.id) return checkout;
    } catch (_) {}
  }

  // Create empty checkout
  const created = await apiPost("/api/shopify/checkout", { lines: [] });
  const checkout = created.checkout;
  if (checkout?.id) setCheckoutId(checkout.id);
  return checkout;
}

export async function addToCart(variantId, quantity = 1) {
  let checkoutId = getCheckoutId();

  if (!checkoutId) {
    const created = await apiPost("/api/shopify/checkout", { lines: [{ variantId, quantity }] });
    if (created?.checkout?.id) setCheckoutId(created.checkout.id);
    return created.checkout;
  }

  await apiPost(`/api/shopify/checkout/${encodeURIComponent(checkoutId)}/lines/add`, {
    lines: [{ variantId, quantity }],
  });

  return apiGet(`/api/shopify/checkout/${encodeURIComponent(checkoutId)}`);
}

export async function updateLineItems(lines) {
  const checkoutId = getCheckoutId();
  if (!checkoutId) return ensureCheckout();

  await apiPost(`/api/shopify/checkout/${encodeURIComponent(checkoutId)}/lines/update`, { lines });
  return apiGet(`/api/shopify/checkout/${encodeURIComponent(checkoutId)}`);
}
