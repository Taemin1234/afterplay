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
    variant === "subtle"
      ? "inline-flex w-fit items-center gap-1 rounded-lg border border-gray-800 bg-black/20 p-1"
      : "flex w-fit gap-4 rounded-lg border border-gray-800 p-1";

  const getOptionClassName = (active: boolean) => {
    if (variant === "subtle") {
      return `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-neon-green/20 text-neon-green" : "text-gray-300 hover:bg-white/5"
      }`;
    }

    return `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
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
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            className="sr-only"
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span className={getOptionClassName(value === option.value)}>
            {option.icon}
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}