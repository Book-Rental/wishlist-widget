import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WishlistPage from "../pages/WishlistPage";

const dispatchSpy = vi.spyOn(window, "dispatchEvent");

const wishlistListProps: {
  onLoadingChange?: (loading: boolean) => void;
} = {};

const wishlistProductsProps: {
  onLoadingChange?: (loading: boolean) => void;
} = {};

vi.mock("../components/WishlistCreate", () => ({
  default: () => <div>Create Component</div>,
}));

vi.mock("../components/WishlistList", () => ({
  default: (props: {
    onLoadingChange?: (loading: boolean) => void;
    onWishlistChange?: (value: string) => void;
  }) => {
    wishlistListProps.onLoadingChange = props.onLoadingChange;

    return (
      <button
        onClick={() => props.onWishlistChange?.("wishlist-1")}
      >
        Wishlist List
      </button>
    );
  },
}));

vi.mock("../components/WishlistProducts", () => ({
  default: (props: {
    onLoadingChange?: (loading: boolean) => void;
  }) => {
    wishlistProductsProps.onLoadingChange =
      props.onLoadingChange;

    return <div>Wishlist Products</div>;
  },
}));

describe("WishlistPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders child components", async () => {
    const user = userEvent.setup();
    render(<WishlistPage />);
    expect(
      screen.getByText("Wishlist List")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create Component")
    ).toBeInTheDocument();
    await user.click(screen.getByText("Wishlist List"));
    expect(
      screen.getByText("Wishlist Products")
    ).toBeInTheDocument();
  });

  it("dispatches loading event when wishlist loading changes", async () => {
    render(<WishlistPage />);
    await act(async () => {
      wishlistListProps.onLoadingChange?.(true);
    });
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
      const event =
        dispatchSpy.mock.calls[
          dispatchSpy.mock.calls.length - 1
        ][0] as CustomEvent;
      expect(event.type).toBe("widget-loading-status");
      expect(event.detail).toBe(true);
    });
  });

  it("dispatches loading event when products loading changes", async () => {
    const user = userEvent.setup();
    render(<WishlistPage />);
    await user.click(screen.getByText("Wishlist List"));
    await act(async () => {
      wishlistProductsProps.onLoadingChange?.(true);
    });
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
      const event =
        dispatchSpy.mock.calls[
          dispatchSpy.mock.calls.length - 1
        ][0] as CustomEvent;
      expect(event.type).toBe("widget-loading-status");
      expect(event.detail).toBe(true);
    });
  });

  it("dispatches false when both loading states are false", async () => {
    const user = userEvent.setup();
    render(<WishlistPage />);
    await user.click(screen.getByText("Wishlist List"));
    await act(async () => {
      wishlistListProps.onLoadingChange?.(false);
      wishlistProductsProps.onLoadingChange?.(false);
    });
    await waitFor(() => {
      const event =
        dispatchSpy.mock.calls[
          dispatchSpy.mock.calls.length - 1
        ][0] as CustomEvent;
      expect(event.detail).toBe(false);
    });
  });

  it("navigates to books page when Add Books is clicked", async () => {
    const user = userEvent.setup();
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    render(<WishlistPage />);
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
    expect(dispatchSpy).toHaveBeenCalledWith(
        expect.any(PopStateEvent)
    );
  });
});