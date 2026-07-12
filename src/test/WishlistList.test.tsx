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
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any
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
        <option
          key={option.value}
          value={option.value}
        >
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

    vi.restoreAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <WishlistList
          selectedWishlist=""
          onWishlistChange={vi.fn()}
          onLoadingChange={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    );

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
    expect(fetch).toHaveBeenCalled();
  });

  it("shows error when fetch fails", async () => {
    mockFetch({}, false);

    renderComponent();

    expect(
      await screen.findByText("Failed to fetch wishlists")
    ).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockFetch({
      data: [],
    });

    renderComponent();

    expect(
      await screen.findByText("No wishlists found.")
    ).toBeInTheDocument();
  });

  it("calls onWishlistChange with first wishlist", async () => {
    const onWishlistChange = vi.fn();

    mockFetch({
      data: [{ _id: "1", name: "Books" }],
    });

    renderComponent({ onWishlistChange });

    await waitFor(() =>
      expect(onWishlistChange).toHaveBeenCalledWith("1")
    );
  });

  it("changes selected wishlist", async () => {
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
});