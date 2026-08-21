import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render,screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WishlistProducts from "../components/WishlistProducts";
import userEvent from "@testing-library/user-event";
import { addToCart } from "../services/cartService";


const mockedAddToCart = vi.mocked(addToCart);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any;
    HOST_CART: string[];
  }
}

interface MockAddToCartModalProps {
  isOpen: boolean;
  onProceed: (data: {
    bookId: string;
    rentalPeriod: string;
    quantity: number;
  }) => Promise<void> | void;
  onClose: () => void;
  product: {
    _id: string;
  };
}


vi.mock("../components/AddToCartModal", () => ({
  default: ({
    isOpen,
    onProceed,
    onClose,
    product,
  }: MockAddToCartModalProps) =>
    isOpen ? (
      <button
        onClick={async () => {
          await onProceed({
            bookId: product._id,
            rentalPeriod: "day",
            quantity: 1,
          });

          onClose();
        }}
      >
        Proceed
      </button>
    ) : null,
}));

vi.mock("../services/cartService", () => ({
  addToCart: vi.fn(),
}));

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Rb_Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),

  Rb_LoadingSpinner: () => <div>Loading Spinner</div>,

  Pagination: () => <div>Pagination</div>,

  Modal: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div>{children}</div> : null),

  ModalHeader: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,

  ProductCard: ({
    title,
    author,
    children,
    onProductClick,
    }: {
    title: string;
    author: string;
    children: React.ReactNode;
    onProductClick?: () => void;
    }) => (
    <div>
        <h3>{title}</h3>

        <p>{author}</p>

        <button onClick={onProductClick}>
        Open Product
        </button>

        {children}
    </div>
    ),
}));

const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

const getDispatchedEvent = (
  eventType: string
): CustomEvent | undefined => {
  const events = dispatchEventSpy.mock.calls.map(
    ([event]: [Event]) => event
  );

  return events.find(
    (event: Event) => event.type === eventType
  ) as CustomEvent | undefined;
};

describe("WishlistProducts", () => {
  const pushStateSpy = vi.spyOn(window.history, "pushState");
  const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
  beforeEach(() => {
    vi.clearAllMocks();
    window.HOST_USER_INFO = {
      _id: "user123",
    };
    window.HOST_CART = [];
    globalThis.fetch = vi.fn();
    pushStateSpy.mockClear();
    dispatchEventSpy.mockClear();
  });

  afterEach(() => {
    window.HOST_CART = [];
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  const renderComponent = () =>
    render(
      <WishlistProducts
        selectedWishlist="wishlist1"
        onLoadingChange={vi.fn()}
      />,
      {
        wrapper: createWrapper(),
      }
    );

  it("shows loading spinner", () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderComponent();
    expect(screen.getByText("Loading Spinner")).toBeInTheDocument();
  });

  it("renders empty wishlist", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });
    renderComponent();
    expect(
      await screen.findByText("Your wishlist is empty")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Start adding books to your wishlist.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "+ Add Books",
      })
    ).toBeInTheDocument();
  });

  it("renders wishlist products", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              _id: "1",
              author: "JK Rowling",
              name: "Harry Potter",
              description: "",
              price: 100,
              coverImage: "",
              rentalPricePerDay: 10,
              rentalPricePerWeek: 50,
              rentalPricePerMonth: 150,
            },
          ],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });
    renderComponent();
    expect(
      await screen.findByText("Harry Potter")
    ).toBeInTheDocument();
    expect(screen.getByText("JK Rowling")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Move to Cart"
      })
    ).toBeInTheDocument();
  });

  it("renders all wishlist products", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              _id: "1",
              author: "Author 1",
              name: "Book 1",
              description: "",
              price: 100,
              coverImage: "",
              rentalPricePerDay: 10,
              rentalPricePerWeek: 50,
              rentalPricePerMonth: 150,
            },
            {
              _id: "2",
              author: "Author 2",
              name: "Book 2",
              description: "",
              price: 200,
              coverImage: "",
              rentalPricePerDay: 20,
              rentalPricePerWeek: 60,
              rentalPricePerMonth: 200,
            },
          ],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });
    renderComponent();
    expect(await screen.findByText("Book 1")).toBeInTheDocument();
    expect(screen.getByText("Book 2")).toBeInTheDocument();
  });

  it("opens add to cart modal when Add to Cart button is clicked", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "1",
                author: "JK Rowling",
                name: "Harry Potter",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });
    renderComponent();
    await screen.findByText("Harry Potter");
    await user.click(
        screen.getByRole("button", {
        name: "Move to Cart"
        })
    );
    expect(
        screen.getByRole("button", {
        name: "Proceed",
        })
    ).toBeInTheDocument();
  });
  
  it("opens remove confirmation modal", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({
        data: {
        books: [
            {
            _id: "1",
            author: "JK Rowling",
            name: "Harry Potter",
            description: "",
            price: 100,
            coverImage: "",
            rentalPricePerDay: 10,
            rentalPricePerWeek: 50,
            rentalPricePerMonth: 150,
            },
        ],
        meta: {
            totalPages: 1,
        },
        },
    }),
    });
    renderComponent();
    await screen.findByText("Harry Potter");
    await user.click(screen.getByText("✕"));
    expect(
    screen.getByText("Remove Book")
    ).toBeInTheDocument();
    expect(
    screen.getByText(/Are you sure/i)
    ).toBeInTheDocument();
  });

  it("shows pagination when multiple pages exist", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({
    data: {
        books: [
        {
            _id: "1",
            author: "Author",
            name: "Book",
            description: "",
            price: 100,
            coverImage: "",
            rentalPricePerDay: 10,
            rentalPricePerWeek: 50,
            rentalPricePerMonth: 150,
        },
        ],
        meta: {
        currentPage: 1,
        totalPages: 5,
        },
    },
    }),
    });
    renderComponent();
    expect(
    await screen.findByText("Pagination")
    ).toBeInTheDocument();
  });

  it("does not render pagination when only one page exists", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({
        data: {
        books: [
            {
            _id: "1",
            author: "Author",
            name: "Book",
            description: "",
            price: 100,
            coverImage: "",
            rentalPricePerDay: 10,
            rentalPricePerWeek: 50,
            rentalPricePerMonth: 150,
            },
        ],
        meta: {
            currentPage: 1,
            totalPages: 1,
        },
        },
    }),
  });

  renderComponent();

  await screen.findByText("Book");

  expect(
    screen.queryByText("Pagination")
  ).not.toBeInTheDocument();
  });

  it("calls onLoadingChange", async () => {
    const onLoadingChange = vi.fn();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({
        data: {
        books: [],
        meta: {
            totalPages: 1,
        },
        },
    }),
    });

    render(
    <WishlistProducts
        selectedWishlist="wishlist1"
        onLoadingChange={onLoadingChange}
    />,
    {
        wrapper: createWrapper(),
    }
    );

    await waitFor(() => {
    expect(onLoadingChange).toHaveBeenCalled();
    });
  });

  it("navigates to book details when product is clicked", async () => {
    const user = userEvent.setup();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "book1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });

    renderComponent();

    await screen.findByText("Book");

    await user.click(
        screen.getByRole("button", {
        name: "Open Product",
        })
    );

    expect(pushStateSpy).toHaveBeenCalledWith(
        {},
        "",
        "/books-details?bookId=book1"
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.any(PopStateEvent)
    );
  });

  it("navigates to books page when Add Books is clicked", async () => {
    const user = userEvent.setup();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });

    renderComponent();

    await screen.findByText("Your wishlist is empty");

    await user.click(
        screen.getByRole("button", {
        name: "+ Add Books",
        })
    );

    expect(pushStateSpy).toHaveBeenCalledWith(
        {},
        "",
        "/books"
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.any(PopStateEvent)
    );
  });

  it("closes remove modal when Cancel is clicked", async () => {
    const user = userEvent.setup();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });

    renderComponent();

    await screen.findByText("Book");

    await user.click(screen.getByText("✕"));

    expect(screen.getByText("Remove Book")).toBeInTheDocument();

    await user.click(
        screen.getByRole("button", {
        name: "Cancel",
        })
    );

    await waitFor(() => {
        expect(
        screen.queryByText("Remove Book")
        ).not.toBeInTheDocument();
    });
  });

  it("removes a book successfully", async () => {
    const user = userEvent.setup();

    (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            data: {
            books: [
                {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
                },
            ],
            meta: {
                totalPages: 1,
            },
            },
        }),
        })

        .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            status: "Success",
            message: "Removed successfully",
        }),
        })

        .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            data: {
            books: [],
            meta: {
                totalPages: 1,
            },
            },
        }),
        });

    renderComponent();

    await screen.findByText("Book");

    await user.click(screen.getByText("✕"));

    await user.click(
        screen.getByRole("button", {
        name: "Remove",
        })
    );

    await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
        type: "wishlist-refresh",
        })
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
        type: "app-toast-notification",
        })
    );
  });

  it("shows error notification when delete fails", async () => {
    const user = userEvent.setup();

    (globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            data: {
            books: [
                {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
                },
            ],
            meta: {
                totalPages: 1,
            },
            },
        }),
        })
        .mockResolvedValueOnce({
        ok: false,
        });

    renderComponent();

    await screen.findByText("Book");

    await user.click(screen.getByText("✕"));

    await user.click(
        screen.getByRole("button", {
        name: "Remove",
        })
    );

    await waitFor(() => {
      expect(
        getDispatchedEvent("app-toast-notification")
      ).toBeDefined();
    });
  });

  it("handles successful add to cart", async () => {
    const user = userEvent.setup();
    mockedAddToCart.mockResolvedValue(undefined);
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });
    renderComponent();
    await screen.findByText("Book");
    await user.click(
        screen.getByRole("button", {
          name: "Move to Cart"
        })
    );
    await user.click(
        screen.getByRole("button", {
        name: "Proceed",
        })
    );
    await waitFor(() => {
        expect(mockedAddToCart).toHaveBeenCalled();
    });
    expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
        type: "app-toast-notification",
        })
    );
  });

  it("shows error when add to cart fails", async () => {
    const user = userEvent.setup();

    mockedAddToCart.mockRejectedValue(
        new Error("Cart failed")
    );

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });

    renderComponent();

    await screen.findByText("Book");

    await user.click(
        screen.getByRole("button", {
        name: "Move to Cart"
        })
    );

    await user.click(
        screen.getByRole("button", {
        name: "Proceed",
        })
    );

    await waitFor(() => {
      expect(
        getDispatchedEvent("app-toast-notification")
      ).toBeDefined();
    });
  });

  it("renders error message when fetching wishlist fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
    });
    renderComponent();
    expect(
        await screen.findByText("Failed to fetch wishlist products")
    ).toBeInTheDocument();
  });

  it("shows Adding... while add to cart request is pending", async () => {
    const user = userEvent.setup();
    let resolvePromise!: () => void;
    mockedAddToCart.mockImplementation(
        () =>
        new Promise<void>((resolve) => {
            resolvePromise = resolve;
        })
    );
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
        data: {
            books: [
            {
                _id: "1",
                author: "Author",
                name: "Book",
                description: "",
                price: 100,
                coverImage: "",
                rentalPricePerDay: 10,
                rentalPricePerWeek: 50,
                rentalPricePerMonth: 150,
            },
            ],
            meta: {
            totalPages: 1,
            },
        },
        }),
    });
    renderComponent();
    await screen.findByText("Book");
    await user.click(
        screen.getByRole("button", { name: "Move to Cart" })
    );
    await user.click(
        screen.getByRole("button", { name: "Proceed" })
    );
    expect(
        screen.getByRole("button", {
        name: "Adding...",
        })
    ).toBeInTheDocument();
    resolvePromise();
    await waitFor(() => {
        expect(mockedAddToCart).toHaveBeenCalled();
    });
  });

  it("changes Move to Cart button to View Cart after successful add", async () => {
    const user = userEvent.setup();

    mockedAddToCart.mockResolvedValue(undefined);

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              _id: "1",
              author: "Author",
              name: "Book",
              description: "",
              price: 100,
              coverImage: "",
              rentalPricePerDay: 10,
              rentalPricePerWeek: 50,
              rentalPricePerMonth: 150,
            },
          ],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });

    renderComponent();

    await screen.findByText("Book");

    await user.click(
      screen.getByRole("button", {
        name: "Move to Cart",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Proceed",
      })
    );

    await waitFor(() => {
      expect(mockedAddToCart).toHaveBeenCalledWith({
        bookId: "1",
        quantity: 1,
        rentalPeriod: "day",
      });
    });

    expect(
      await screen.findByRole("button", {
        name: "View Cart",
      })
    ).toBeInTheDocument();
  });

  it("shows View Cart when book already exists in HOST_CART", async () => {
    window.HOST_CART = ["1"];

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              _id: "1",
              author: "Author",
              name: "Book",
              description: "",
              price: 100,
              coverImage: "",
              rentalPricePerDay: 10,
              rentalPricePerWeek: 50,
              rentalPricePerMonth: 150,
            },
          ],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });

    renderComponent();

    await screen.findByText("Book");

    expect(
      screen.getByRole("button", {
        name: "View Cart",
      })
    ).toBeInTheDocument();
  });

  it("updates button when cart-state-changed event is dispatched", async () => {
    window.HOST_CART = [];

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          books: [
            {
              _id: "1",
              author: "Author",
              name: "Book",
              description: "",
              price: 100,
              coverImage: "",
              rentalPricePerDay: 10,
              rentalPricePerWeek: 50,
              rentalPricePerMonth: 150,
            },
          ],
          meta: {
            totalPages: 1,
          },
        },
      }),
    });

    renderComponent();

    await screen.findByText("Book");

    expect(
      screen.getByRole("button", {
        name: "Move to Cart",
      })
    ).toBeInTheDocument();

    window.dispatchEvent(
      new CustomEvent("cart-state-changed", {
        detail: ["1"],
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "View Cart",
        })
      ).toBeInTheDocument();
    });
  });
});