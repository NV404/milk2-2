import React from "react";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { getUser } from "@/utils/session.server";
import { db } from "@/db/index.server";
import { orders, orderItems, Users, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = (await getUser(request)) as Users;
  if (!user) {
    return redirect("/login");
  }

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.consumerId, user.id),
    orderBy: [desc(orders.createdAt)],
    with: {
      orderItems: {
        with: {
          product: true,
        },
      },
    },
  });

  return json({ user, orders: userOrders });
}

export default function MyOrdersPage() {
  const { user, orders } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Order #{order.id.slice(0, 8)}</span>
                  <Badge>{order.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">Total: ₹{order.totalAmount.toFixed(2)}</p>
                <p className="mb-2">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <h3 className="font-semibold mt-4 mb-2">Items:</h3>
                <ul className="list-disc list-inside">
                  {order.orderItems.map((item) => (
                    <li key={item.id}>
                      {item.product.name} - Quantity: {item.quantity}, Price: ₹
                      {item.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
