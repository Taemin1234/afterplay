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
};

export default function TypeSelector<T extends string>({
  name,
  value,
  options,
  onChange,
  ariaLabel = "타입 선택",
  className = "",
}: TypeSelectorProps<T>) {
  return (
    <div
      className={`flex w-fit gap-4 rounded-lg border border-gray-800 bg-black p-1 ${className}`.trim()}
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
          <span
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              value === option.value
                ? "bg-[#39FF14] text-black"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {option.icon}
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}