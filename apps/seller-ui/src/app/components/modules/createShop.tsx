import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import React from "react";
import { useForm } from "react-hook-form";
import { shopCategories } from "../../utils/categories";

function CreateShop({
  sellerId,
  setActiveStep,
}: {
  sellerId: string;
  setActiveStep: (step: number) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  type FormData = {
    name: string;
    bio: string;
    category: string;
    sellerId: string;
    address: string;
    opening_hours: string;
    website?: string;
  };

  const shopCreateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/create-shop`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setActiveStep(3); // Move to the next step after successful shop creation
    },
    onError: (error: AxiosError) => {
      if (error.response) {
        console.error("Error creating shop:", error.response.data);
      } else {
        console.error("Error creating shop:", error.message);
      }
    },
  });
  const onSubmit = async (data: any) => {
    const shopData = {
      name: data.shopName,
      bio: data.bio,
      category: data.category,
      sellerId,
      address: data.address,
      opening_hours: data.openingHours,
      ...(data.website ? { website: data.website } : {}),
    };
    shopCreateMutation.mutate(shopData);
  };

  const countWords = (text: string) => text.trim().split(/\s+/).length;
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-2xl font-bold text-green-950 text-center mb-2">
          Set up your Store
        </h1>
        {/* Shop Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Shop Name *
          </label>
          <input
            type="text"
            placeholder="Enter shop name"
            {...register("shopName", { required: "Shop name is required" })}
            className={`mt-1 p-1 block w-full border ${
              errors.shopName ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.shopName && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.shopName.message)}
            </p>
          )}
        </div>
        {/* Bio */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Bio (Max 100 words) *
          </label>
          <input
            type="text"
            placeholder="Enter shop bio"
            {...register("bio", {
              required: "Bio is required",
              validate: (value) =>
                countWords(value) <= 100 || "Bio must be 100 words or less",
            })}
            className={`mt-1 p-1 block w-full border ${
              errors.bio ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.bio && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.bio.message)}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Address *
          </label>
          <input
            type="text"
            placeholder="Enter shop location"
            {...register("address", { required: "Address is required" })}
            className={`mt-1 p-1 block w-full border ${
              errors.address ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.address.message)}
            </p>
          )}
        </div>
        {/* Shop opening hours */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Opening Hours *
          </label>
          <input
            type="text"
            placeholder="e.g. Mon-Fri 9am-5pm"
            {...register("openingHours", {
              required: "Opening hours are required",
            })}
            className={`mt-1 p-1 block w-full border ${
              errors.openingHours ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.openingHours && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.openingHours.message)}
            </p>
          )}
        </div>
        {/* Website */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="text"
            placeholder="https://example.com"
            {...register("website", {
              pattern: {
                value:
                  /^(https?:\/\/)?(www\.)?[a-z0-9]+\.[a-z]{2,}(\.[a-z]{2,})?$/,
                message: "Enter a valid URL",
              },
            })}
            className={`mt-1 p-1 block w-full border ${
              errors.website ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          />
          {errors.website && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.website.message)}
            </p>
          )}
        </div>
        {/* Shop Categories */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Shop Category *
          </label>
          <select
            {...register("category", { required: "Category is required" })}
            className={`mt-1 p-2 block w-full border ${
              errors.category ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500`}
          >
            <option value="">Select a category</option>
            {shopCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.category.message)}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={shopCreateMutation.isPending}
          className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition"
        >
          Create Shop
        </button>
        {shopCreateMutation.isError && (
          <p className="text-red-500 text-xs mt-2">
            {shopCreateMutation.error instanceof AxiosError
              ? (shopCreateMutation.error.response?.data as any)?.message ||
                "An error occurred"
              : "An error occurred while creating the shop."}
          </p>
        )}

        {shopCreateMutation.isPending && (
          <p className="text-blue-500 text-xs mt-2">Creating shop...</p>
        )}
        {shopCreateMutation.isSuccess && (
          <p className="text-green-500 text-xs mt-2">
            Shop created successfully!
          </p>
        )}
      </form>
    </div>
  );
}

export default CreateShop;
