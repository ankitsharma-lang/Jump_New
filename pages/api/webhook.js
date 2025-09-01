export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  // Log the webhook body for debugging
  console.log("Contentful webhook received:", req.body);

  // (Optional) Add custom logic here (e.g., ISR revalidation)
  // await res.revalidate('/'); // If using ISR in Next.js

  res.status(200).json({ received: true });
}