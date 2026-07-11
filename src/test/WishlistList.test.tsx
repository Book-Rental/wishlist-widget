import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const useQueryMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => useQueryMock(),
}));

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Rb_LoadingSpinner: () => <div>Loading...</div>,

  Dropdown: ({
    options,
    value,
    onChange,
  }: DropdownProps) => (
    <select
      data-testid="wishlist-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option: DropdownOption) => (
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
  beforeEach(() => {
    vi.clearAllMocks();

    window.HOST_USER_INFO = {
      _id: "user123",
    };
  });

  const defaultProps = {
    selectedWishlist: "",
    onWishlistChange: vi.fn(),
    onLoadingChange: vi.fn(),
  };

  it("shows loading spinner", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<WishlistList {...defaultProps} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows dropdown with wishlists", () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          {
            _id: "1",
            name: "Books",
          },
          {
            _id: "2",
            name: "Novels",
          },
        ],
      },
    });

    render(<WishlistList {...defaultProps} />);

    expect(screen.getByTestId("wishlist-dropdown")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
    expect(screen.getByText("Novels")).toBeInTheDocument();
  });

  it("shows error message", () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch wishlists"),
    });

    render(<WishlistList {...defaultProps} />);

    expect(
      screen.getByText("Failed to fetch wishlists")
    ).toBeInTheDocument();
  });

  it("shows empty state", () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [],
      },
    });

    render(<WishlistList {...defaultProps} />);

    expect(screen.getByText("No wishlists found.")).toBeInTheDocument();
  });

  it("calls onWishlistChange with first wishlist", () => {
    const onWishlistChange = vi.fn();

    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          {
            _id: "123",
            name: "Wishlist 1",
          },
        ],
      },
    });

    render(
      <WishlistList
        {...defaultProps}
        onWishlistChange={onWishlistChange}
      />
    );

    expect(onWishlistChange).toHaveBeenCalledWith("123");
  });

  it("calls onLoadingChange", () => {
    const onLoadingChange = vi.fn();

    useQueryMock.mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    });

    render(
      <WishlistList
        {...defaultProps}
        onLoadingChange={onLoadingChange}
      />
    );

    expect(onLoadingChange).toHaveBeenCalledWith(true);
  });

  it("changes selected wishlist", () => {
    const onWishlistChange = vi.fn();

    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          {
            _id: "1",
            name: "Books",
          },
          {
            _id: "2",
            name: "Science",
          },
        ],
      },
    });

    render(
      <WishlistList
        {...defaultProps}
        selectedWishlist="1"
        onWishlistChange={onWishlistChange}
      />
    );

    fireEvent.change(screen.getByTestId("wishlist-dropdown"), {
      target: {
        value: "2",
      },
    });

    expect(onWishlistChange).toHaveBeenCalledWith("2");
  });

  it("does not call onWishlistChange if selectedWishlist already exists", () => {
    const onWishlistChange = vi.fn();

    useQueryMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: [
          {
            _id: "1",
            name: "Books",
          },
        ],
      },
    });

    render(
      <WishlistList
        {...defaultProps}
        selectedWishlist="1"
        onWishlistChange={onWishlistChange}
      />
    );

    expect(onWishlistChange).not.toHaveBeenCalled();
  });
});