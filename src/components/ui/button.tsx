import Link from "next/link";
import type { LinkProps } from "next/link";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "link";
export type ButtonSize = "sm" | "md" | "icon";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = SharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & {
    href?: undefined;
  };

type ButtonAsLink = SharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps | "href"> &
  Omit<LinkProps, "href"> & {
    href: LinkProps["href"];
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold transition-opacity disabled:opacity-50 active:opacity-80";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-full px-4 py-2 text-xs",
  md: "rounded-full px-5 py-2.5 text-sm",
  icon: "size-11 shrink-0 rounded-full p-0",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white active:bg-primary-600",
  secondary: "border border-taupe-200 text-foreground",
  danger: "bg-red-500 text-white",
  success: "bg-emerald-600 text-white",
  ghost: "text-foreground active:opacity-70",
  link: "text-foreground underline font-medium",
};

function buildClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
}: Pick<SharedProps, "variant" | "size" | "fullWidth" | "className">) {
  // The secondary variant gets a filled white circle with a ring when icon-only,
  // matching the existing toggle/back-control styling in the app.
  const iconSecondary =
    size === "icon" && variant === "secondary"
      ? "bg-white ring-1 ring-taupe-200"
      : "";
  return [
    base,
    sizeClasses[size],
    variantClasses[variant],
    iconSecondary,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  const {
    variant,
    size,
    fullWidth,
    leftIcon,
    rightIcon,
    loading,
    loadingText,
    className,
    children,
    ...rest
  } = props;

  const content = (
    <>
      {leftIcon}
      {loading && loadingText !== undefined ? loadingText : children}
      {rightIcon}
    </>
  );

  const computedClassName = buildClassName({ variant, size, fullWidth, className });

  if (rest.href !== undefined && rest.href !== null) {
    const { href, ...anchorRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={computedClassName} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const { type, disabled, ...buttonRest } = rest as ButtonAsButton;
  return (
    <button
      type={type ?? "button"}
      disabled={disabled ?? loading}
      className={computedClassName}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
