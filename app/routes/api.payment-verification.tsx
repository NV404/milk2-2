import { db } from "@/db/index.server";
import { orders } from "@/db/schema";
import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import crypto from "crypto";
import { eq } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      await request.json();

    if (
      !orderId ||
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the Razorpay signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpaySignature) {
      // Payment is verified, update the order status
      await db
        .update(orders)
        .set({ paymentInfo: { razorpayPaymentId, razorpayOrderId } })
        .where(eq(orders.id, orderId));

      return json({ success: true, message: "Payment verified successfully" });
    } else {
      // Signature verification failed
      return json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
