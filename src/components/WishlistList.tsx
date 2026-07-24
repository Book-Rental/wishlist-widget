import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown, Rb_LoadingSpinner } from "@rentbook/rentbook-ui-lib";;

type Props = {
  selectedWishlist: string;
  onWishlistChange: (value: string) => void;
  onLoadingChange: (loading: boolean) => void;
};

type Wishlist = {
  _id: string;
  name: string;
};

const WishlistList = ({
  selectedWishlist,
  onWishlistChange,
  onLoadingChange
}: Props) => {
  const userId =
    window.HOST_USER_INFO?._id ?? "6a3bbe38827e96ec21dcb390";

  const fetchWishlists = async (userId: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishList/wishlistName/${userId}`,
       {
      method: "GET",
      credentials: "include",
    }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch wishlists");
    }

    return response.json();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["wishlistNames", userId],
    queryFn: () => fetchWishlists(userId),
  });

  const options =
    data?.data?.map((item: Wishlist) => ({
      label: item.name,
      value: item._id,
    })) ?? [];

  useEffect(() => {
    if (!selectedWishlist && options.length) {
      onWishlistChange(options[0].value);
    }
  }, [selectedWishlist, options, onWishlistChange]);


  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  if (error instanceof Error) {
    return <p>{error.message}</p>;
  }

  if (!isLoading && options.length === 0) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <p className="text-sm text-gray-500">
        No wishlists found.
      </p>
    </div>
  );
}
  return (
    <div className="w-full md:w-72">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Rb_LoadingSpinner />
        </div>
      ) : (
        <Dropdown
          label="Wishlist"
          placeholder="Select Wishlist"
          options={options}
          value={selectedWishlist}
          onChange={onWishlistChange}
        />
      )}
    </div>
  );
};

export default WishlistList;