interface ButtonProps {
  variant?: 'primary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'md' | 'full';
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  as?: 'button' | 'span';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  rounded = 'md',
  children,
  icon,
  onClick,
  disabled = false,
  className = '',
  title,
  type = 'button',
  as = 'button',
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#39ff14] text-black font-bold',
    outline: 'border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10',
    danger: 'border border-red-400/40 text-red-300 hover:bg-red-600',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs sm:text-sm',
    md: 'px-3 py-2 text-sm sm:px-4 sm:text-base',
    lg: 'px-4 py-2.5 text-base sm:px-6 sm:py-3 sm:text-lg',
  };

  const roundedStyles = {
    none: 'rounded-none',
    md: 'rounded-md',
    full: 'rounded-full',
  };

  const classNames = `inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`.trim();

  if (as === 'span') {
    return (
      <span onClick={onClick} title={title} className={classNames}>
        {icon}
        {children}
      </span>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={classNames}>
      {icon}
      {children}
    </button>
  );
}
