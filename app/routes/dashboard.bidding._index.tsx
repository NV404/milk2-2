import React from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { db } from "@/db/index.server";
import { products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Home, ShoppingCartIcon, TrendingUp, User } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const biddableProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      image: products.image,
      quantity: products.quantity,
      unit: products.unit,
      farmerName: users.fullName,
    })
    .from(products)
    .leftJoin(users, eq(products.farmerId, users.id))
    .where(eq(products.isBidding, true));

  return json({ biddableProducts });
}

export default function BiddableItemsList() {
  const { biddableProducts } = useLoaderData<typeof loader>();

  const navItems = [
    { name: "Home", path: "/dashboard", icon: <Home className="h-6 w-6" /> },
    {
      name: "Cart",
      path: "/dashboard/cart",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
    },
    {
      name: "Bidding",
      path: "/dashboard/bidding",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      name: "Profile",
      path: "/dashboard/profile",
      icon: <User className="h-6 w-6" />,
    },
  ];

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Biddable Items</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {biddableProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img
                  src={product.image || "/placeholder-image.jpg"}
                  alt={product.name}
                  className="object-cover rounded-md"
                />
              </div>
              <p className="text-lg font-semibold">
                Starting Price: ₹{product.price.toFixed(2)}
              </p>
              <p>
                Quantity: {product.quantity} {product.unit}
              </p>
              <p>Farmer: {product.farmerName}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/dashboard/bidding/${product.id}`}>Place Bid</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 shadow-lg">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center ${
                location.pathname === item.path
                  ? "text-green-500"
                  : "text-gray-600"
              }`}
            >
              {item.icon}
              <div>
                <span className="text-xs">{item.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
