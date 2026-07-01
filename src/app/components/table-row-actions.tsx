import Link from "next/link";
import type { LinkProps } from "next/link";

type TableActionTone = "default" | "danger";

const toneClass: Record<TableActionTone, string> = {
  default: "text-taupe-500 hover:bg-primary-50 hover:text-primary",
  danger: "text-red-500 hover:bg-red-50 hover:text-red-600",
};

function actionClassName(tone: TableActionTone, className = "") {
  return [
    "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    toneClass[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type TableActionGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function TableActionGroup({
  children,
  className = "",
}: TableActionGroupProps) {
  return (
    <div className={`flex items-center justify-end gap-1.5 ${className}`}>
      {children}
    </div>
  );
}

type SharedTableActionProps = {
  label: string;
  children: React.ReactNode;
  tone?: TableActionTone;
  className?: string;
};

type TableActionLinkProps = SharedTableActionProps & {
  href: LinkProps["href"];
};

export function TableActionLink({
  href,
  label,
  children,
  tone = "default",
  className,
}: TableActionLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={actionClassName(tone, className)}
    >
      {children}
    </Link>
  );
}

type TableActionButtonProps = SharedTableActionProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedTableActionProps | "type">;

export function TableActionButton({
  label,
  children,
  tone = "default",
  className,
  disabled,
  ...props
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={actionClassName(tone, className)}
      {...props}
    >
      {children}
    </button>
  );
}
