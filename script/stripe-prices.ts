import Stripe from "stripe";

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
  const prices = await stripe.prices.list({ limit: 100 });
  const prodIds = [...new Set(prices.data.map(p => (typeof p.product === "string" ? p.product : p.product.id)))];
  const products = await stripe.products.list({ limit: 100, ids: prodIds } as any);
  const byId = new Map(products.data.map(p => [p.id, p.name]));
  for (const p of prices.data) {
    console.log(p.id, "|", byId.get(typeof p.product === "string" ? p.product : p.product.id), "|", p.currency, "|", ((p.unit_amount ?? 0) / 100).toFixed(2), "| interval:", p.recurring?.interval ?? "one-time", "| active:", p.active);
  }
}
main();
