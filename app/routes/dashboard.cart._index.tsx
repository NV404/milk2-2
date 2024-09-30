import React, { useState, useEffect } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Home,
  ShoppingCartIcon,
  TrendingUp,
  User,
} from "lucide-react";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getUser } from "@/utils/session.server";
import { products, Users } from "@/db/schema";
import { db } from "@/db/index.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = (await getUser(request)) as Users;
  const allProducts = await db.query.products.findMany({
    with: {
      farmer: true,
    },
  });
  return { user, allProducts };
}

const BuyerCartPage = () => {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { allProducts } = useLoaderData<typeof loader>();
  const location = useLocation();

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      const items = allProducts.filter((product) => parsedCart[product.id]);
      setCartItems(items);
    }
  }, [allProducts]);

  const updateCart = (productId: string, quantity: number) => {
    const newCart = { ...cart, [productId]: (cart[productId] || 0) + quantity };
    if (newCart[productId] <= 0) {
      delete newCart[productId];
    }
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    const items = allProducts.filter((product) => newCart[product.id]);
    setCartItems(items);
  };

  const removeFromCart = (productId: string) => {
    const newCart = { ...cart };
    delete newCart[productId];
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    const items = allProducts.filter((product) => newCart[product.id]);
    setCartItems(items);
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * cart[item.id],
      0
    );
  };

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
    <div className="container mx-auto mb-20">
      <div className="flex items-center mb-6">
        {/* <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-6 w-6" />
        </Button> */}
        <h1 className="text-2xl font-bold">Your Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link to="/dashboard" className="text-green-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex items-center p-4">
                <img
                  src={item.image || ""}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-md mr-4"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.farmer?.fullName}
                  </p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="mr-2">
                      ₹{item.price}/{item.unit}
                    </Badge>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateCart(item.id, -1)}
                        className="h-6 w-6 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="mx-2 font-semibold">
                        {cart[item.id]}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateCart(item.id, 1)}
                        className="h-6 w-6 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
          </div>
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white mb-2">
              <Link to="/dashboard/cart/confirm">Proceed to Checkout</Link>
            </Button>
            <Link
              to="/dashboard"
              className="block text-center text-green-600 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </>
      )}

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

export default BuyerCartPage;
