import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import Razorpay from "razorpay";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { orderId, amount } = await request.json();
    console.log(orderId, amount, "orderId, amount");

    if (!orderId || !amount) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: orderId,
      payment_capture: 1, // Auto-capture the payment
    });

    console.log(razorpayOrder.id, "razorpayOrder.id");

    return json({ razorpayOrderId: razorpayOrder.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return json({ error: "Failed to create Razorpay order" }, { status: 500 });
  }
}
