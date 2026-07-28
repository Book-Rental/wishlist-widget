import { useEffect, useState } from "react";
import WishlistCreate from "../components/WishlistCreate";
import WishlistList from "../components/WishlistList";
import WishlistProducts from "../components/WishlistProducts";
import { Rb_Button } from "@rentbook/rentbook-ui-lib";
import { LibraryBig } from "lucide-react";

const WishlistPage = () => {
  const [selectedWishlist, setSelectedWishlist] = useState("");
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("widget-loading-status", {
        detail: wishlistLoading || productsLoading,
      })
    );
  }, [wishlistLoading, productsLoading]);

    const navigateToCategorys = () => {
    window.history.pushState({}, "", `/books`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return (
    <div className="mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Wishlist Dropdown */}
        <div className="w-full md:w-72">
          <WishlistList
            selectedWishlist={selectedWishlist}
            onWishlistChange={setSelectedWishlist}
            onLoadingChange={setWishlistLoading}
          />
        </div>

        <div className="w-full md:w-auto">
          <WishlistCreate />
        </div>
      </div>
      
      {selectedWishlist ? (
        <WishlistProducts
          selectedWishlist={selectedWishlist}
          onLoadingChange={setProductsLoading}
        />
      ) : (
       <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <div className="text-6xl"><LibraryBig className="mx-auto h-16 w-16 text-gray-400" /></div>

            <h3 className="mt-4 text-xl font-semibold">
              Your wishlist is empty
            </h3>

            <p className="mt-2 text-gray-500">
              Start adding books to your wishlist.
            </p>
            <Rb_Button onClick={navigateToCategorys} className="mt-4">+ Add Books</Rb_Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;