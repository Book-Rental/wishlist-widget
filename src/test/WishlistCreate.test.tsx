import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import WishlistCreate from "../components/WishlistCreate";

declare global {
  interface Window {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    HOST_USER_INFO: any
  }
}

const invalidateQueries = vi.fn();
const mutateMock = vi.fn();

vi.mock("axios");

type MutationOptions = {
  onSuccess?: () => void;
  onError?: () => void;
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries,
  }),
  useMutation: (options: MutationOptions) => ({
    mutate: (payload: unknown) => mutateMock(payload, options),
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
};

type ButtonProps = ChildrenProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

type InputProps = InputHTMLAttributes<HTMLInputElement>;

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Modal: ({ isOpen, children }: ModalProps) =>
    isOpen ? <div>{children}</div> : null,

  ModalHeader: ({ children }: ChildrenProps) => (
    <h2>{children}</h2>
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
        name: /\+ create new wishlist/i,
      })
    ).toBeInTheDocument();
  });

  it("opens modal on button click", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    expect(
      screen.getByText(/create wishlist/i)
    ).toBeInTheDocument();
  });

  it("updates wishlist input", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText(
      /enter wishlist name/i
    );

    await user.type(input, "Books");

    expect(input).toHaveValue("Books");
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
      screen.getByRole("button", { name: "Create" })
    ).toBeDisabled();
  });

  it("calls mutate with trimmed value", async () => {
    const user = userEvent.setup();

    render(<WishlistCreate />);

    await user.click(
      screen.getByRole("button", {
        name: /\+ create new wishlist/i,
      })
    );

    const input = screen.getByPlaceholderText(
      /enter wishlist name/i
    );

    await user.type(input, "  My Wishlist  ");

    await user.click(
      screen.getByRole("button", {
        name: "Create",
      })
    );

    expect(mutateMock).toHaveBeenCalled();

    const payload = mutateMock.mock.calls[0][0];

    expect(payload).toEqual({
      name: "My Wishlist",
      userId: "user123",
    });
  });
});