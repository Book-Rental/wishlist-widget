import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
} from "react";

import WishlistCreate from "../components/WishlistCreate";
import axios from "axios";
import { toast } from "react-toastify";

declare global {
  interface Window {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any;
  }
}

const invalidateQueries = vi.fn();
const mutateMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),

  useMutation: (options: {
    mutationFn: (payload: unknown) => Promise<unknown>;
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
  }) => ({
    mutate: async (payload: unknown) => {
      mutateMock(payload);

      try {
        const response = await options.mutationFn(payload);
        options.onSuccess?.(response);
      } catch (error) {
        options.onError?.(error);
      }
    },
    isPending: false,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ToastContainer: () => <div>ToastContainer</div>,
}));

type ChildrenProps = {
  children: ReactNode;
};

type ModalProps = ChildrenProps & {
  isOpen: boolean;
  onClose?: () => void;
};

type ModalHeaderProps = ChildrenProps & {
  onClose?: () => void;
};

type ButtonProps = ChildrenProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

type InputProps = InputHTMLAttributes<HTMLInputElement>;

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Modal: ({ isOpen, onClose, children }: ModalProps) =>
    isOpen ? (
      <div>
        <button aria-label="modal-overlay-close" onClick={onClose}>
          close-modal
        </button>
        {children}
      </div>
    ) : null,

  ModalHeader: ({ onClose, children }: ModalHeaderProps) => (
    <h2>
      {children}
      <button aria-label="modal-header-close" onClick={onClose}>
        ×
      </button>
    </h2>
  ),

  Rb_Button: ({ children, ...props }: ButtonProps) => (
    <button {...props}>{children}</button>
  ),

  Rb_Input: (props: InputProps) => <input {...props} />,

  Rb_Label: ({ children }: ChildrenProps) => (
    <label>{children}</label>
  ),
}));

describe("WishlistCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.HOST_USER_INFO = {
      _id: "user123",
    };
  });

  it("renders create button", () => {
    render(<WishlistCreate />);

    expect(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    ).toBeInTheDocument();
  });

  it("opens modal", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    expect(screen.getByText("Create Wishlist")).toBeInTheDocument();
  });

  it("closes modal via Modal's onClose", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    expect(screen.getByText("Create Wishlist")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "modal-overlay-close" })
    );

    expect(screen.queryByText("Create Wishlist")).not.toBeInTheDocument();
  });

  it("closes modal via ModalHeader's onClose", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    await user.click(
      screen.getByRole("button", { name: "modal-header-close" })
    );

    expect(screen.queryByText("Create Wishlist")).not.toBeInTheDocument();
  });

  it("updates input value", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText("Enter wishlist name");

    await user.type(input, "Books");

    expect(input).toHaveValue("Books");
  });

  it("disables create button when input empty", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Create",
      })
    ).toBeDisabled();
  });

  it("calls mutate with trimmed value", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText("Enter wishlist name");

    await user.type(input, "  My Wishlist  ");

    await user.click(
      screen.getByRole("button", {
        name: "Create",
      })
    );

    expect(mutateMock).toHaveBeenCalledWith({
      name: "My Wishlist",
      userId: "user123",
    });
  });

  it("creates wishlist successfully", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create",
      })
    );

    expect(toast.success).toHaveBeenCalledWith(
      "Wishlist created successfully!"
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["wishlistNames", "user123"],
    });
  });

  it("shows error toast when API fails", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          message: "Already exists",
        },
      },
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create",
      })
    );

    expect(toast.error).toHaveBeenCalledWith("Already exists");
  });

  it("shows default error toast when error message is missing", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockRejectedValue({});

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create",
      })
    );

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong.");
    });
  });
});