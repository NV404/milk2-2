import React, { useState } from "react";
import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useNavigation,
} from "@remix-run/react";
import { db } from "@/db/index.server";
import { products, bids, Users } from "@/db/schema";
import { getUser } from "@/utils/session.server";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = (await getUser(request)) as Users;
  const productId = params.productId;

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  const latestBids = await db
    .select()
    .from(bids)
    .where(eq(bids.productId, productId))
    .orderBy(desc(bids.amount), desc(bids.createdAt))
    .limit(5);

  const highestBid = latestBids[0]?.amount || product.price;

  return json({ product, latestBids, highestBid, userId: user.id });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = (await getUser(request)) as Users;
  const productId = params.productId;
  const formData = await request.formData();
  const bidAmount = Number(formData.get("bidAmount"));

  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    return json({ error: "Product not found" }, { status: 404 });
  }

  const highestBid = await db
    .select({ amount: bids.amount })
    .from(bids)
    .where(eq(bids.productId, productId))
    .orderBy(desc(bids.amount))
    .limit(1);

  const currentHighestBid = highestBid[0]?.amount || product.price;

  if (bidAmount <= currentHighestBid) {
    return json(
      { error: "Bid must be higher than the current highest bid" },
      { status: 400 }
    );
  }

  try {
    const newBid = await db
      .insert(bids)
      .values({
        productId,
        bidderId: user.id,
        amount: bidAmount,
        status: "active",
      })
      .returning();

    return json({
      success: true,
      message: "Bid placed successfully",
      newBid: newBid[0],
    });
  } catch (error) {
    console.error("Error placing bid:", error);
    return json({ error: "Failed to place bid" }, { status: 500 });
  }
}

const BiddingPage = () => {
  const { product, latestBids, highestBid, userId } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [bidAmount, setBidAmount] = useState(highestBid + 1);

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBidAmount(Number(e.target.value));
  };

  return (
    <div className="container mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 mb-4 md:mb-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="md:w-1/2 md:pl-8">
              <p className="text-lg mb-2">{product.description}</p>
              <p className="text-xl font-semibold mb-4">
                Starting Price: ₹{product.price}
              </p>
              <p className="text-2xl font-bold text-green-600 mb-6">
                Current Highest Bid: ₹{highestBid}
              </p>

              <Form method="post" className="space-y-4">
                <div>
                  <Label htmlFor="bidAmount">Your Bid</Label>
                  <Input
                    type="number"
                    id="bidAmount"
                    name="bidAmount"
                    value={bidAmount}
                    onChange={handleBidChange}
                    min={highestBid + 1}
                    step="0.01"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={navigation.state === "submitting"}
                  className="w-full"
                >
                  {navigation.state === "submitting"
                    ? "Placing Bid..."
                    : "Place Bid"}
                </Button>
              </Form>

              {actionData?.error && (
                <p className="text-red-500 mt-2">{actionData.error}</p>
              )}
              {actionData?.success && (
                <p className="text-green-500 mt-2">{actionData.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bids</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {latestBids.map((bid) => (
              <li
                key={bid.id}
                className="flex justify-between items-center border-b py-2"
              >
                <span
                  className={bid.bidderId === userId ? "font-semibold" : ""}
                >
                  {bid.bidderId === userId ? "You" : `User ${bid.bidderId}`}
                </span>
                <span className="text-lg">₹{bid.amount}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiddingPage;
