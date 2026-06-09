import Link from "next/link";
import type { LinkProps } from "next/link";

const cardBase = "rounded-2xl bg-white ring-1 ring-taupe-200 shadow-sm";

type SharedProps = {
  className?: string;
  children?: React.ReactNode;
};

type CardAsDiv = SharedProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof SharedProps> & {
    href?: undefined;
  };

type CardAsLink = SharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps | "href"> &
  Omit<LinkProps, "href"> & {
    href: LinkProps["href"];
  };

export type CardProps = CardAsDiv | CardAsLink;

export function Card(props: CardProps) {
  const { className = "", children, ...rest } = props;

  if (rest.href !== undefined && rest.href !== null) {
    const { href, ...anchorRest } = rest as CardAsLink;
    return (
      <Link
        href={href}
        className={`${cardBase} block transition-opacity active:opacity-70 ${className}`}
        {...anchorRest}
      >
        {children}
      </Link>
    );
  }

  const divRest = rest as CardAsDiv;
  return (
    <div className={`${cardBase} ${className}`} {...divRest}>
      {children}
    </div>
  );
}
