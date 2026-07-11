import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Modal,
  ModalHeader,
  Pagination,
  ProductCard,
  Rb_Button,
  Rb_LoadingSpinner,
} from "@rentbook/rentbook-ui-lib";
import { LibraryBig } from "lucide-react";

type Props = {
  selectedWishlist: string;
  onLoadingChange: (loading: boolean) => void;
};

type Book = {
  _id: string;
  author: string;
  name: string;
  description: string;
  price: number;
  coverImage: string;
};

const userId =
  window.HOST_USER_INFO?._id ?? "6a3bbe38827e96ec21dcb390";

const WishlistProducts = ({
  selectedWishlist,
  onLoadingChange,
}: Props) => {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWishlist]);
  const fetchWishlistProducts = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/wishList/${userId}?wishListID=${selectedWishlist}&page=${currentPage}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch wishlist products");
    }

    return response.json();
  };

  const {
    data,
    isPending,
    error,
  } = useQuery({
    queryKey: ["wishlistProducts", selectedWishlist, currentPage],
    queryFn: fetchWishlistProducts,
    enabled: Boolean(selectedWishlist),
  });

  useEffect(() => {
    onLoadingChange(isPending);
  }, [isPending, onLoadingChange]);

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

      setIsModalOpen(false);
      setSelectedBookId("");
    },
  });

  const products: Book[] = data?.data?.books ?? [];
  const meta = data?.data?.meta;

  const redirectToPdp = (bookId: string) => {
    window.history.pushState({}, "", `/books-details?bookId=${bookId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const openDeleteModal = (bookId: string) => {
    setSelectedBookId(bookId);
    setIsModalOpen(true);
  };

  if (isPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Rb_LoadingSpinner />
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="py-10 text-center text-red-500">
        {error.message}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Wishlist Books</h2>
      </div>

      {products.length === 0 ? (
        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <div className="text-6xl"><LibraryBig className="mx-auto h-16 w-16 text-gray-400" /></div>

            <h3 className="mt-4 text-xl font-semibold">
              Your wishlist is empty
            </h3>

            <p className="mt-2 text-gray-500">
              Start adding books to your wishlist.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((product) => (
              <div
                key={product._id}
                className="flex justify-center"
              >
                <div className="group relative inline-block">
                  <button
                    className="absolute top-5 right-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition-all duration-200 opacity-100 scale-100 sm:opacity-0 sm:scale-90 sm:group-hover:opacity-100 sm:group-hover:scale-100 hover:bg-red-500 hover:text-white"
                    onClick={() => openDeleteModal(product._id)}
                  >
                    ✕
                  </button>

                  <ProductCard
                    imageUrl={product.coverImage}
                    title={product.name}
                    author={product.author}
                    priceText={`₹${product.price}`}
                    rating={4.5}
                    onProductClick={() =>
                      redirectToPdp(product._id)
                    }
                  >
                    <div className="mt-4 px-2 pb-2">
                      <Rb_Button className="w-full rounded-lg">
                        Add to Cart
                      </Rb_Button>
                    </div>
                  </ProductCard>
                </div>
              </div>
            ))}
          </div>

          {meta?.totalPages > 1 && (
            <div className="mt-10 flex justify-end border-t pt-6">
              <Pagination
                currentPage={meta.currentPage}
                totalPages={meta.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          Remove Book
        </ModalHeader>

        <div className="p-6">
          <p className="leading-6 text-gray-600">
            Are you sure you want to remove this book from your
            wishlist? This action cannot be undone.
          </p>

          <div className="mt-8 flex justify-end gap-3">
            <Rb_Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Rb_Button>

            <Rb_Button
              className="!bg-red-600 hover:!bg-red-700"
              onClick={() => deleteBook.mutate(selectedBookId)}
              disabled={deleteBook.isPending}
            >
              {deleteBook.isPending ? "Removing..." : "Remove"}
            </Rb_Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WishlistProducts;