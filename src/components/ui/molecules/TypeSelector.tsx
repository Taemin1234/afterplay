import type { ReactNode } from "react";

type TypeSelectorOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type TypeSelectorProps<T extends string> = {
  name: string;
  value: T;
  options: readonly TypeSelectorOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  variant?: "solid" | "subtle" | "mobile";
};

export default function TypeSelector<T extends string>({
  name,
  value,
  options,
  onChange,
  ariaLabel = "옵션 선택",
  className = "",
  variant = "solid",
}: TypeSelectorProps<T>) {
  const containerClassName =
    variant === "mobile"
      ? "flex flex-nowrap justify-spacebetween w-full items-stretch gap-1 border border-slate-700/80 bg-[#0c1222]/95 p-1"
      : variant === "subtle"
        ? "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 bg-black/20 p-1"
        : "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 p-1 sm:gap-2";

  const getOptionClassName = (active: boolean) => {
    if (variant === "mobile") {
      return `inline-flex h-full min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${
        active
          ? "text-neon-green"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`;
    }

    if (variant === "subtle") {
      return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
        active ? "bg-neon-green/20 text-neon-green" : "text-gray-300 hover:bg-white/5"
      }`;
    }

    return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
      active ? "bg-[#39FF14] text-black" : "text-gray-500 hover:text-white"
    }`;
  };

  return (
    <div
      className={`${containerClassName} ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
      // style={variant === "mobile" ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`${variant === "mobile" ? "min-w-0 flex-1 flex justify-center" : ""} cursor-pointer`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className="sr-only"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className={getOptionClassName(value === option.value)}>
            {option.icon ? (
              <span
                className={`${variant === "mobile" ? "inline-flex h-5 w-5 items-center justify-center" : "inline-flex items-center"}`}
              >
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
