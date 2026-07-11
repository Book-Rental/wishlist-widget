import { useEffect, useState } from "react";
import WishlistCreate from "../components/WishlistCreate";
import WishlistList from "../components/WishlistList";
import WishlistProducts from "../components/WishlistProducts";

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
    return (
        <div className="mx-auto p-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="w-full md:w-72">
                    <WishlistList
                        selectedWishlist={selectedWishlist}
                        onWishlistChange={setSelectedWishlist}
                         onLoadingChange={setWishlistLoading}
                    />
                </div>

                {/* Create Button */}
                <div className="w-full md:w-auto">
                    <WishlistCreate/>
                </div>
            </div>

            <WishlistProducts selectedWishlist={selectedWishlist} onLoadingChange={setProductsLoading}/>
        </div>
    );
};

export default WishlistPage;