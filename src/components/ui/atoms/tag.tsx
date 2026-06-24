import type { MouseEventHandler, ReactNode } from "react";

interface TagProps {
  variant?: "subtle" | "neon";
  clickable?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

export default function Tag({
  variant = "subtle",
  clickable = false,
  children,
  icon,
  className = "",
  onClick,
}: TagProps) {
  const variantStyles = {
    subtle:
      "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium tracking-wide text-gray-300",
    neon: "inline-flex items-center rounded-md bg-neon-point/5 px-2 py-1 text-xs text-neon-point/70",
  };

  const interactiveStyles = clickable
    ? "cursor-pointer transition-colors"
    : "";

  const classNames = `${variantStyles[variant]} ${interactiveStyles} ${className}`.trim();

  const Component = clickable ? "button" : "span";

  return (
    <Component 
      onClick={onClick} 
      className={classNames}
      {...(clickable && { type: "button" })}
    >
      {icon}
      {children}
    </Component>
  );
}