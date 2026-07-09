import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Modal,
  ModalHeader,
  ProductCard,
  Rb_Button,
} from "@rentbook/rentbook-ui-lib";

type Props = {
  userId: string;
  selectedWishlist: string;
};

type Book = {
  _id: string;
  name: string;
  description: string;
  price: number;
  coverImage: string;
};

const WishlistProducts = ({ selectedWishlist, userId }: Props) => {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["wishlistProducts", selectedWishlist],
    enabled: !!selectedWishlist,
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/wishList/${userId}?wishListID=${selectedWishlist}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch wishlist products");
      }

      return response.json();
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/wishList/delete/${bookId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wishlistId: selectedWishlist,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      return response.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wishlistProducts", selectedWishlist],
      });

      setIsOpen(false);
      setSelectedBookId("");
    },
  });

  if (!selectedWishlist) return <p>Select a wishlist.</p>;
  if (isPending) return <p>Loading...</p>;
  if (error instanceof Error) return <p>{error.message}</p>;

  const products: Book[] = data?.data?.books ?? [];

   const redirectToPdp = (id:string) => {
    window.history.pushState({}, '', `/books-details?bookId=${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-items-center gap-6">
        {products.map((product) => (
  <div key={product._id} className="relative group w-full max-w-[280px]">

<button
  className="
    absolute top-5 right-3.5 z-10
    flex h-8 w-8 items-center justify-center
    rounded-full bg-white shadow-md
    transition-all duration-200
    opacity-0 pointer-events-none
    group-hover:opacity-100 group-hover:pointer-events-auto
    hover:bg-gray-100
  "
  onClick={() => {
    setSelectedBookId(product._id);
    setIsOpen(true);
  }}
>
  ✕
</button>

  <ProductCard
    imageUrl={product.coverImage}
    title={product.name}
    author="Unknown"
    priceText={`₹${product.price}`}
    rating={4.5}
     onProductClick={() => redirectToPdp(product._id)}
  >
    <div className="mt-4 pb-1">
      <Rb_Button className="w-full">
        Add to Cart
      </Rb_Button>
    </div>
  </ProductCard>
</div>
))}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader
          onClose={() => setIsOpen(false)}
        >Delete Wishlist</ModalHeader>

        <div className="p-6">
          <p className="mb-6">
            Are you sure you want to remove this product from your wishlist?
          </p>

          <div className="flex justify-end gap-3">
            <Rb_Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Rb_Button>

            <Rb_Button
            className="!bg-[#DC2626]"
              onClick={() => deleteBook.mutate(selectedBookId)}
            >
              Remove
            </Rb_Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WishlistProducts;