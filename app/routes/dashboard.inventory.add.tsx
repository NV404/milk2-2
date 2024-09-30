import React from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect } from "@remix-run/react";
import { db } from "@/db/index.server";
import { products, Users } from "@/db/schema";
import { getUser } from "@/utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const quantity = formData.get("quantity") as string;
  const unit = formData.get("unit") as string;
  const price = formData.get("price") as string;
  const description = formData.get("description") as string;

  const user = (await getUser(request)) as Users;

  const product = await db.insert(products).values({
    name,
    price: Number(price),
    quantity: Number(quantity),
    unit,
    type: "",
    description,
    farmerId: user.id,
  });

  if (product) {
    return redirect("/dashboard/inventory");
  }
}

const AddItemPage = () => {
  const units = ["kg", "g", "l", "ml", "piece", "dozen", "bundle"];

  return (
    <div className="min-h-screen">
      <div>
        <div className="mb-6 flex justify-center">
          <Button
            variant="outline"
            className="w-32 h-32 rounded-full border-dashed border-2 border-gray-300 flex flex-col items-center justify-center"
          >
            <Camera className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Add Photo</span>
          </Button>
        </div>

        <Form method="post" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold text-gray-700">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter item name"
              className="rounded-lg"
            />
          </div>

          <div className="flex space-x-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="quantity" className="font-semibold text-gray-700">
                Quantity
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="Enter quantity"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="unit" className="font-semibold text-gray-700">
                Unit
              </Label>
              <Select name="unit">
                <SelectTrigger id="unit" className="rounded-lg">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="font-semibold text-gray-700">
              Price per unit
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="Enter price"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="font-semibold text-gray-700"
            >
              Description
            </Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter item description"
              className="rounded-lg"
            />
          </div>

          <Button type="submit" className="w-full rounded-lg">
            Add Item
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default AddItemPage;
