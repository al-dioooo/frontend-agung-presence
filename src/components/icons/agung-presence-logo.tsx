import type { SVGProps } from "react";

type AgungPresenceLogoIconProps = SVGProps<SVGSVGElement> & {
  variant?: "normal" | "inverted";
};

export function AgungPresenceLogoIcon({
  variant = "normal",
  ...props
}: AgungPresenceLogoIconProps) {
  const isInverted = variant === "inverted";

  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect width="100" height="100" fill={isInverted ? "#1485FD" : "white"} />
      <path
        d="M68.5596 82H86.7461L68.0194 49.5643C70.1019 53.3165 68.798 58.0598 65.0672 60.2139C61.4349 62.3109 56.8274 61.1887 54.5487 57.7324L68.5596 82Z"
        fill={isInverted ? "#BFDBFE" : "#93C5FD"}
      />
      <path
        d="M59.4663 34.75L59.4633 34.7553L50.3731 19.0106L41.2829 34.7553L41.2798 34.75L14 82H32.1865L50.3731 50.5L54.5487 57.7324C56.8274 61.1887 61.4349 62.3109 65.0672 60.2139C68.798 58.0598 70.1019 53.3165 68.0194 49.5643L59.4663 34.75Z"
        fill={isInverted ? "white" : "#1485FD"}
      />
    </svg>
  );
}
