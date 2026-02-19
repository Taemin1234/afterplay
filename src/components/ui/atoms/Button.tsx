interface ButtonProps {
    variant?: 'primary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    rounded?: 'none' | 'md' | 'full';
    children: React.ReactNode;
    icon? : React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    as?: 'button' | 'span';
  }
  
export default function Button ({ 
    variant = 'primary', 
    size = 'md', 
    rounded = 'md', 
    children, 
    icon,
    onClick,
    as = 'button',
  }: ButtonProps) {

    
    const variantStyles = {
        primary: 'bg-[#39ff14] text-black font-bold',
        outline: 'border border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };
  
    const sizeStyles = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
  
    const roundedStyles = {
      none: 'rounded-none',
      md: 'rounded-md',
      full: 'rounded-full'
    };
  
    const className = `flex items-center gap-2 cursor-pointer transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]}`;
  
    if (as === 'span') {
      return (
        <span onClick={onClick} className={className}>
          {icon}
          {children}
        </span>
      );
    }

    return (
      <button type="button" onClick={onClick} className={className}>
        {icon}
        {children}
      </button>
    );
  };