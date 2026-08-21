import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
} from "react";
import axios from "axios";

import WishlistCreate from "../components/WishlistCreate";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    mutationFn: (payload: { name: string; userId: string }) => Promise<unknown>;
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
  }) => ({
    mutate: async (payload: { name: string; userId: string }) => {
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

const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

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
      <div data-testid="modal">
        <button
          aria-label="modal-overlay-close"
          onClick={onClose}
        >
          close-modal
        </button>
        {children}
      </div>
    ) : null,

  ModalHeader: ({ onClose, children }: ModalHeaderProps) => (
    <h2>
      {children}
      <button
        aria-label="modal-header-close"
        onClick={onClose}
      >
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

  it("renders create new wishlist button", () => {
    render(<WishlistCreate />);

    expect(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    ).toBeInTheDocument();
  });

  it("does not show modal initially", () => {
    render(<WishlistCreate />);

    expect(
      screen.queryByText("Create Wishlist")
    ).not.toBeInTheDocument();
  });

  it("opens modal when create new wishlist button is clicked", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    expect(
      screen.getByText("Create Wishlist")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Enter wishlist name")
    ).toBeInTheDocument();
  });

  it("closes modal via Modal onClose", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "modal-overlay-close",
      })
    );

    expect(
      screen.queryByText("Create Wishlist")
    ).not.toBeInTheDocument();
  });

  it("closes modal via ModalHeader onClose", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "modal-header-close",
      })
    );

    expect(
      screen.queryByText("Create Wishlist")
    ).not.toBeInTheDocument();
  });

  it("updates wishlist name input", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText(
      "Enter wishlist name"
    );

    await user.type(input, "My Books");

    expect(input).toHaveValue("My Books");
  });

  it("disables create button when input is empty", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    expect(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    ).toBeDisabled();
  });

  it("keeps create button disabled when input contains only spaces", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText(
      "Enter wishlist name"
    );

    await user.type(input, "   ");

    expect(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    ).toBeDisabled();
  });

  it("enables create button when wishlist name is entered", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    expect(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    ).toBeEnabled();
  });

  it("calls mutate with trimmed wishlist name and userId", async () => {
    const mockedAxios = vi.mocked(axios);
    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "  My Wishlist  "
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    expect(mutateMock).toHaveBeenCalledWith({
      name: "My Wishlist",
      userId: "user123",
    });
  });

  it("calls API with correct wishlist payload", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/api/wishList/group`,
        {
          name: "Books",
          userId: "user123",
        },
        {
          withCredentials: true,
        }
      );
    });
  });

  it("creates wishlist successfully and shows success notification", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    const event =
      dispatchEventSpy.mock.calls[0][0] as CustomEvent;

    expect(event.type).toBe("app-toast-notification");

    expect(event.detail).toEqual({
      message: "Wishlist created successfully!",
      type: "success",
    });
  });

  it("invalidates wishlist names query after successful creation", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["wishlistNames", "user123"],
      });
    });
  });

  it("closes modal after successful wishlist creation", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Create Wishlist")
      ).not.toBeInTheDocument();
    });
  });

  it("shows error notification when API returns an error message", async () => {
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
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    const event =
      dispatchEventSpy.mock.calls[0][0] as CustomEvent;

    expect(event.type).toBe("app-toast-notification");

    expect(event.detail).toEqual({
      message: "Already exists",
      type: "error",
    });
  });

  it("shows default error notification when API error has no message", async () => {
    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockRejectedValue({});

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    const event =
      dispatchEventSpy.mock.calls[0][0] as CustomEvent;

    expect(event.type).toBe("app-toast-notification");

    expect(event.detail).toEqual({
      message: "Something went wrong.",
      type: "error",
    });
  });

  it("uses empty string as userId when HOST_USER_INFO is unavailable", async () => {
    window.HOST_USER_INFO = undefined;

    const mockedAxios = vi.mocked(axios);

    mockedAxios.post.mockResolvedValue({
      data: {},
    });

    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    await user.type(
      screen.getByPlaceholderText("Enter wishlist name"),
      "Books"
    );

    await user.click(
      screen.getByRole("button", {
        name: /^Create$/,
      })
    );

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/api/wishList/group`,
        {
          name: "Books",
          userId: "",
        },
        {
          withCredentials: true,
        }
      );
    });
  });
});