import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dropdown } from "@rentbook/rentbook-ui-lib";;

type Props = {
  userId: string;
  selectedWishlist: string;
  onWishlistChange: (value: string) => void;
};

type Wishlist = {
  _id: string;
  name: string;
};

const WishlistList = ({
  userId,
  selectedWishlist,
  onWishlistChange,
}: Props) => {

  const { data, isLoading, error } = useQuery({
    queryKey: ["wishlistNames", userId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/wishList/wishlistName/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch wishlists");
      }

      return response.json();
    },
  });

  const options = useMemo(
    () =>
      data?.data?.map((item: Wishlist) => ({
        label: item.name,
        value: item._id,
      })) ?? [],
    [data]
  );

  useEffect(() => {
    if (options.length > 0 && !selectedWishlist) {
      onWishlistChange(options[0].value);
    }
  }, [options, selectedWishlist, onWishlistChange]);


  useEffect(() => {
    const event = new CustomEvent("widget-loading-status", {
      detail: isLoading
    });
    window.dispatchEvent(event);
  }, [isLoading]);
  if (isLoading) return <p>Loading...</p>;

  if (error instanceof Error) {
    return <p>{error.message}</p>;
  }
  return (
    <div className="w-full md:w-72">
      <Dropdown
        label="Wishlist"
        placeholder="Select Wishlist"
        options={options}
        value={selectedWishlist}
        onChange={onWishlistChange}
      />
    </div>
  );
};

export default WishlistList;