import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import WishlistList from "../components/WishlistList";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any;
  }
}

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
};

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Rb_LoadingSpinner: () => <div>Loading...</div>,

  Dropdown: ({ options, value, onChange }: DropdownProps) => (
    <select
      data-testid="wishlist-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

describe("WishlistList", () => {
  let queryClient: QueryClient;

  const mockFetch = (data: unknown, ok = true) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok,
      json: async () => data,
    } as Response);
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    window.HOST_USER_INFO = {
      _id: "user123",
    };
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof WishlistList>> = {}
  ) => {
    const defaultProps = {
      selectedWishlist: "",
      onWishlistChange: vi.fn(),
      onLoadingChange: vi.fn(),
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <WishlistList {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  it("shows loading spinner while fetching wishlists", async () => {
    let resolveFetch: (value: Response) => void;

    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderComponent();

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      json: async () => ({
        data: [{ _id: "1", name: "Books" }],
      }),
    } as Response);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading...")
      ).not.toBeInTheDocument();
    });
  });

  it("calls onLoadingChange with true while loading", async () => {
    const onLoadingChange = vi.fn();

    let resolveFetch: (value: Response) => void;

    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderComponent({ onLoadingChange });

    await waitFor(() => {
      expect(onLoadingChange).toHaveBeenCalledWith(true);
    });

    resolveFetch!({
      ok: true,
      json: async () => ({
        data: [],
      }),
    } as Response);
  });

  it("calls onLoadingChange with false after loading completes", async () => {
    const onLoadingChange = vi.fn();

    mockFetch({
      data: [{ _id: "1", name: "Books" }],
    });

    renderComponent({ onLoadingChange });

    await waitFor(() => {
      expect(onLoadingChange).toHaveBeenCalledWith(false);
    });
  });

  it("renders dropdown after successful fetch", async () => {
    mockFetch({
      data: [
        { _id: "1", name: "Books" },
        { _id: "2", name: "Science" },
      ],
    });

    renderComponent();

    expect(
      await screen.findByTestId("wishlist-dropdown")
    ).toBeInTheDocument();

    expect(screen.getByText("Books")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
  });

  it("calls fetch with correct URL and options", async () => {
    mockFetch({
      data: [{ _id: "1", name: "Books" }],
    });

    renderComponent();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/api/wishList/wishlistName/user123`,
        {
          method: "GET",
          credentials: "include",
        }
      );
    });
  });

  it("shows error when fetch fails", async () => {
    mockFetch({}, false);

    renderComponent();

    expect(
      await screen.findByText("Failed to fetch wishlists")
    ).toBeInTheDocument();
  });

  it("renders nothing when no wishlists are returned", async () => {
    mockFetch({
      data: [],
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(
        screen.queryByText("Loading...")
      ).not.toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("wishlist-dropdown")
    ).not.toBeInTheDocument();

    expect(container.firstChild).toBeNull();
  });

  it("automatically selects the first wishlist when no wishlist is selected", async () => {
    const onWishlistChange = vi.fn();

    mockFetch({
      data: [
        { _id: "1", name: "Books" },
        { _id: "2", name: "Science" },
      ],
    });

    renderComponent({
      onWishlistChange,
    });

    await waitFor(() => {
      expect(onWishlistChange).toHaveBeenCalledWith("1");
    });
  });

  it("does not automatically change wishlist when one is already selected", async () => {
    const onWishlistChange = vi.fn();

    mockFetch({
      data: [
        { _id: "1", name: "Books" },
        { _id: "2", name: "Science" },
      ],
    });

    renderComponent({
      selectedWishlist: "2",
      onWishlistChange,
    });

    await screen.findByTestId("wishlist-dropdown");

    expect(onWishlistChange).not.toHaveBeenCalled();
  });

  it("changes selected wishlist when dropdown value changes", async () => {
    const onWishlistChange = vi.fn();

    mockFetch({
      data: [
        { _id: "1", name: "Books" },
        { _id: "2", name: "Science" },
      ],
    });

    renderComponent({
      selectedWishlist: "1",
      onWishlistChange,
    });

    fireEvent.change(
      await screen.findByTestId("wishlist-dropdown"),
      {
        target: {
          value: "2",
        },
      }
    );

    expect(onWishlistChange).toHaveBeenCalledWith("2");
  });

  it("uses empty userId when HOST_USER_INFO is unavailable", async () => {
    window.HOST_USER_INFO = undefined;

    mockFetch({
      data: [{ _id: "1", name: "Books" }],
    });

    renderComponent();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/api/wishList/wishlistName/`,
        {
          method: "GET",
          credentials: "include",
        }
      );
    });
  });
});