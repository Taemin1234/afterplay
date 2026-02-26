interface ButtonProps {
  variant?: 'primary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'md' | 'full';
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
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
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#39ff14] text-black font-bold',
    outline: 'border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10',
    danger: 'border border-red-400/40 text-red-300 hover:bg-red-600',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const roundedStyles = {
    none: 'rounded-none',
    md: 'rounded-md',
    full: 'rounded-full',
  };

  const classNames = `inline-flex items-center gap-2 transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`.trim();

  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={classNames}>
      {icon}
      {children}
    </button>
  );
}
