import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ReactNode,
  ButtonHTMLAttributes,
} from "react";

import AddToCartModal from "../components/AddToCartModal";

type Product = {
  _id: string;
  rentalPricePerDay: number;
  rentalPricePerWeek: number;
  rentalPricePerMonth: number;
};

const product: Product = {
  _id: "book-1",
  rentalPricePerDay: 10,
  rentalPricePerWeek: 50,
  rentalPricePerMonth: 150,
};

type ChildrenProps = {
  children: ReactNode;
};

type ModalProps = ChildrenProps & {
  isOpen: boolean;
  onClose?: () => void;
};

type HeaderProps = ChildrenProps & {
  onClose?: () => void;
};

type ButtonProps = ChildrenProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

type DropdownProps = {
  options: {
    label: string;
    value: string;
  }[];
  value: string;
  onChange: (value: string) => void;
};

type RadioProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

vi.mock("@rentbook/rentbook-ui-lib", () => ({
  Modal: ({ isOpen, children }: ModalProps) =>
    isOpen ? <div>{children}</div> : null,

  ModalHeader: ({ children, onClose }: HeaderProps) => (
    <div>
      <h2>{children}</h2>
      <button
        aria-label="close-modal"
        onClick={onClose}
      >
        X
      </button>
    </div>
  ),

  ModalBody: ({ children }: ChildrenProps) => (
    <div>{children}</div>
  ),

  ModalFooter: ({ children }: ChildrenProps) => (
    <div>{children}</div>
  ),

  Dropdown: ({
    options,
    value,
    onChange,
  }: DropdownProps) => (
    <select
      data-testid="duration-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select</option>

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

  Rb_Button: ({
    children,
    ...props
  }: ButtonProps) => (
    <button {...props}>{children}</button>
  ),

  Rb_Radio: ({
    label,
    checked,
    onChange,
  }: RadioProps) => (
    <label>
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  ),
}));

describe("AddToCartModal", () => {
  const onClose = vi.fn();
  const onProceed = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <AddToCartModal
        isOpen
        onClose={onClose}
        onProceed={onProceed}
        product={product}
      />
    );

  it("renders modal", () => {
    renderComponent();

    expect(
      screen.getByText("Choose Purchase Option")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Proceed")
    ).toBeInTheDocument();
  });

  it("shows rental dropdown after selecting rent", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    expect(
      screen.getByTestId("duration-dropdown")
    ).toBeInTheDocument();
  });

  it("keeps proceed button disabled initially", () => {
    renderComponent();

    expect(
      screen.getByRole("button", {
        name: "Proceed",
      })
    ).toBeDisabled();
  });

  it("enables proceed after rental duration selection", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    await user.selectOptions(
      screen.getByTestId("duration-dropdown"),
      "week"
    );

    expect(
      screen.getByRole("button", {
        name: "Proceed",
      })
    ).toBeEnabled();
  });

  it("calls onProceed with expected payload", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    await user.selectOptions(
      screen.getByTestId("duration-dropdown"),
      "month"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Proceed",
      })
    );

    expect(onProceed).toHaveBeenCalledWith({
      bookId: "book-1",
      quantity: 1,
      pricingMode: "rent",
      rentalPeriod: "month",
    });
  });

  it("closes modal after successful proceed", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    await user.selectOptions(
      screen.getByTestId("duration-dropdown"),
      "day"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Proceed",
      })
    );

    expect(onClose).toHaveBeenCalled();
  });

  it("closes modal from header close button", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("close-modal")
    );

    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onProceed when duration is not selected", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    expect(
      screen.getByRole("button", {
        name: "Proceed",
      })
    ).toBeDisabled();

    expect(onProceed).not.toHaveBeenCalled();
  });

  it("renders rental options correctly", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByLabelText("Rent Now")
    );

    expect(
      screen.getByText("1 Day - ₹10")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 Week - ₹50")
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 Month - ₹150")
    ).toBeInTheDocument();
  });
});