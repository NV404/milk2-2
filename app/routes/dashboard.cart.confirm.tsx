import React, { useState, useEffect } from "react";
import { useNavigate, useLoaderData, Form } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getUser } from "@/utils/session.server";
import { db } from "@/db/index.server";
import { orders, orderItems, Users, products } from "@/db/schema";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return redirect("/login");
  }
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = (await getUser(request)) as Users;
  if (!user) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const postalCode = formData.get("postalCode") as string;
  const paymentMethod = formData.get("paymentMethod") as string;

  const cartData = JSON.parse(formData.get("cartData") as string);
  const totalAmount = parseFloat(formData.get("totalAmount") as string);

  // Create the order
  const [order] = await db
    .insert(orders)
    .values({
      consumerId: user.id,
      status: "pending",
      totalAmount,
      paymentInfo: { method: paymentMethod },
      deliveryDetails: { address, city, postalCode },
    })
    .returning();

  // Create order items
  for (const [productId, quantity] of Object.entries(cartData)) {
    const product = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
    });

    if (product) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        quantity: Number(quantity),
        price: product.price,
      });
    }
  }

  return redirect("/dashboard/myorders");
}

export default function CartConfirmationPage() {
  const { user } = useLoaderData<typeof loader>();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      // In a real application, you'd fetch the product details here
      const items = Object.keys(parsedCart).map((id) => ({
        id,
        name: `Product ${id}`,
        price: 10,
      }));
      setCartItems(items);
      const total = items.reduce(
        (sum, item) => sum + item.price * parsedCart[item.id],
        0
      );
      setTotalAmount(total);
    }
  }, []);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Order Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <input type="hidden" name="cartData" value={JSON.stringify(cart)} />
            <input
              type="hidden"
              name="totalAmount"
              value={totalAmount.toString()}
            />

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" required />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" required />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" name="postalCode" required />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select name="paymentMethod" defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between mb-2">
                  <span>{item.name}</span>
                  <span>₹{(item.price * cart[item.id]).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <strong>Total: ₹{totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Confirm Order
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
