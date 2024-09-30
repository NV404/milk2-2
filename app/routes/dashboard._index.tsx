import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Home,
  Search,
  User,
  TrendingUp,
  ShoppingCart,
  MapPin,
  ShoppingCartIcon,
} from "lucide-react";
import { Link, useLoaderData, useLocation } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "@/utils/session.server";
import { products, Users } from "@/db/schema";
import { db } from "@/db/index.server";
import { eq } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = (await getUser(request)) as Users;
  const allProducts = await db.query.products.findMany({
    with: {
      farmer: true,
    },
  });
  return { user, allProducts };
}

const BuyerHomePage = () => {
  const [cart, setCart] = useState<any>({});
  const { allProducts } = useLoaderData<typeof loader>();
  const location = useLocation();

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

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateCart = (productId: any, quantity: any) => {
    const newCart = { ...cart, [productId]: (cart[productId] || 0) + quantity };
    if (newCart[productId] <= 0) {
      delete newCart[productId];
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  return (
    <div className="container mx-auto mb-20">
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search fresh local produce..."
          className="w-full rounded-full bg-gray-100 border-none shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProducts.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative">
              <img
                src={product.image || ""}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
              >
                {product.farmer?.fullName}
              </Badge>
            </div>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <span className="text-green-600 font-bold">
                  ₹{product.price}/{product.unit}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-1" />{" "}
                {/* {product.distance.toFixed(1)} km away */}
                10 km away
              </p>
            </CardContent>
            <CardFooter>
              {cart[product.id] ? (
                <div className="flex items-center justify-between w-full">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateCart(product.id, -1)}
                    className="h-8 w-8"
                  >
                    -
                  </Button>
                  <span className="mx-2 font-semibold">
                    {cart[product.id]} in cart
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateCart(product.id, 1)}
                    className="h-8 w-8"
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => updateCart(product.id, 1)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Add to Cart
                </Button>
              )}
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
};

export default BuyerHomePage;
