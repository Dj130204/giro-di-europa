import express from "express";

const router = express.Router();

const DOMAIN = process.env.SHOPIFY_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";

async function storefront(query, variables = {}) {
  const res = await fetch(`https://${DOMAIN}/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify({ status: res.status, errors: json.errors, json }, null, 2));
  }
  return json.data;
}

// Products (grid)
router.get("/products", async (req, res) => {
  const q = `
    query Products($first: Int!) {
      products(first: $first) {
        nodes {
          id
          handle
          title
          featuredImage { url altText }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  `;
  const data = await storefront(q, { first: 24 });
  res.json(data.products.nodes);
});

// Product by handle (detail page)
router.get("/products/:handle", async (req, res) => {
  const q = `
    query ProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        descriptionHtml
        featuredImage { url altText }
        images(first: 10) { nodes { url altText } }
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            price { amount currencyCode }
          }
        }
      }
    }
  `;
  const data = await storefront(q, { handle: req.params.handle });
  res.json(data.productByHandle);
});

/**
 * Checkout API flow (works with your unauthenticated_write_checkouts scope)
 * - Create checkout
 * - Add/update line items
 * - Send user to checkout.webUrl
 */

// Create checkout
router.post("/checkout", async (req, res) => {
  const { lines } = req.body; // [{ variantId, quantity }]
  const q = `
    mutation CheckoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
          subtotalPriceV2 { amount currencyCode }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  priceV2 { amount currencyCode }
                  image { url altText }
                  product { handle title }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;
  const input = { lineItems: (lines || []).map(l => ({ variantId: l.variantId, quantity: l.quantity })) };
  const data = await storefront(q, { input });
  res.json(data.checkoutCreate);
});

// Get checkout
router.get("/checkout/:id", async (req, res) => {
  const q = `
    query Checkout($id: ID!) {
      node(id: $id) {
        ... on Checkout {
          id
          webUrl
          subtotalPriceV2 { amount currencyCode }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                variant {
                  id
                  title
                  priceV2 { amount currencyCode }
                  image { url altText }
                  product { handle title }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await storefront(q, { id: req.params.id });
  res.json(data.node);
});

// Add line items
router.post("/checkout/:id/lines/add", async (req, res) => {
  const { lines } = req.body; // [{ variantId, quantity }]
  const q = `
    mutation AddLines($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
      checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
        checkout { id webUrl }
        userErrors { field message }
      }
    }
  `;
  const data = await storefront(q, {
    checkoutId: req.params.id,
    lineItems: lines.map(l => ({ variantId: l.variantId, quantity: l.quantity })),
  });
  res.json(data.checkoutLineItemsAdd);
});

// Update line items
router.post("/checkout/:id/lines/update", async (req, res) => {
  const { lines } = req.body; // [{ id, quantity }]
  const q = `
    mutation UpdateLines($checkoutId: ID!, $lineItems: [CheckoutLineItemUpdateInput!]!) {
      checkoutLineItemsUpdate(checkoutId: $checkoutId, lineItems: $lineItems) {
        checkout { id webUrl }
        userErrors { field message }
      }
    }
  `;
  const data = await storefront(q, { checkoutId: req.params.id, lineItems: lines });
  res.json(data.checkoutLineItemsUpdate);
});

export default router;
