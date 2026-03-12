interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'form' | 'none';
}

export default function Input({ variant = 'form', className = '', type = 'text', ...props }: InputProps) {

    const variantStyles = {
        form: 'rounded-md border border-gray-800 bg-black px-3 py-2.5 text-sm outline-none focus:border-neon-green sm:text-base',
        none: 'h-full flex-1 bg-transparent text-sm outline-none transition placeholder:text-slate-500 focus:outline-none sm:text-base'
    };

    const composedClassName = `w-full text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${className}`.trim();

    return (
        <input 
            type={type}
            className={composedClassName}
            autoFocus={false}
            {...props}
        />
    )
}
