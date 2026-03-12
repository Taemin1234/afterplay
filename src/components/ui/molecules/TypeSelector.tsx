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
  variant?: "solid" | "subtle";
  size?: "sm" | "md";
};

export default function TypeSelector<T extends string>({
  name,
  value,
  options,
  onChange,
  ariaLabel = "옵션 선택",
  className = "",
  variant = "solid",
  size = "md",
}: TypeSelectorProps<T>) {
  const containerClassName = (() => {
    if (variant === "subtle") {
      return size === "sm"
        ? "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 bg-black/20 p-1"
        : "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 bg-black/20 p-1 sm:gap-1.5";
    }

    return size === "sm"
      ? "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 p-1 md:max-w-fit"
      : "inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-800 p-1 sm:gap-2 md:max-w-fit";
  })();

  const getOptionClassName = (active: boolean) => {
    if (variant === "subtle") {
      const subtleSizeClass =
        size === "sm"
          ? "gap-1 px-2 py-1 text-xs sm:gap-1.5 sm:px-2.5"
          : "gap-1.5 px-2.5 py-1.5 text-xs sm:gap-2 sm:px-3 sm:text-sm";

      return `inline-flex items-center whitespace-nowrap rounded-md font-medium transition-colors ${subtleSizeClass} ${
        active ? "bg-neon-green/20 text-neon-green" : "text-gray-300 hover:bg-white/5"
      }`;
    }

    const solidSizeClass =
      size === "sm"
        ? "gap-1 px-2 py-1.5 text-xs sm:gap-1.5 sm:px-3"
        : "gap-1.5 px-3 py-1.5 text-xs sm:gap-2 sm:px-4 sm:py-2 sm:text-sm";

    return `w-full inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all ${solidSizeClass} ${
      active ? "bg-[#39FF14] text-black" : "text-gray-500 hover:text-white"
    }`;
  };

  return (
    <div
      className={`${containerClassName} ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex-1 cursor-pointer md:flex-none"
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
                className='inline-flex items-center'
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
