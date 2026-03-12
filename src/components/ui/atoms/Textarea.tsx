interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: 'form' | 'none';
  }
  
  export default function Textarea({ variant = 'form' ,placeholder, value, onChange, className = '', ...props }: TextareaProps) {
  
    const variantStyles = {
      form: 'rounded-md border border-gray-800 bg-black px-3 py-2.5 outline-none focus:border-neon-green',
      none: 'bg-transparent focus:outline-none placeholder:text-slate-500'
    };
  
    const baseStyles = 'min-h-40 w-full resize-none text-sm text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-52 sm:text-base';
    const composedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();
  
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={composedClassName}
        {...props}
      />
    );
  }
