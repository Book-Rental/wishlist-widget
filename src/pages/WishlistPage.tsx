import { useState } from "react";
import WishlistCreate from "../components/WishlistCreate";
import WishlistList from "../components/WishlistList";
import WishlistProducts from "../components/WishlistProducts";

type Props = {
    userId: string;
};

const WishlistPage = ({ userId }: Props) => {
    const [selectedWishlist, setSelectedWishlist] = useState("");

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                {/* Dropdown */}
                <div className="w-full md:w-72">
                    <WishlistList
                        userId={userId}
                        selectedWishlist={selectedWishlist}
                        onWishlistChange={setSelectedWishlist}
                    />
                </div>

                {/* Create Button */}
                <div className="w-full md:w-auto">
                    <WishlistCreate userId={userId} />
                </div>
            </div>

            <WishlistProducts userId={userId} selectedWishlist={selectedWishlist} />
        </div>
    );
};

export default WishlistPage;