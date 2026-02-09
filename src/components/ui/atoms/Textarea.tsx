interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: 'form' | 'none';
  }
  
  export default function Textarea({ variant = 'form' ,placeholder, value, onChange, ...props }: TextareaProps) {
  
    const variantStyles = {
      form: 'bg-black border border-gray-800 p-3 rounded-md outline-none focus:border-neon-green',
      none: 'bg-transparent focus:outline-none placeholder:text-slate-500'
    };
  
    const baseStyles = 'w-full h-52 text-white transition-all resize-none p-0.5';
    const className = `${baseStyles} ${variantStyles[variant]}`;
  
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={className}
        {...props}
      />
    );
  }