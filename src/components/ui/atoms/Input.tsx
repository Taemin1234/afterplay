interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'form' | 'none';
}

export default function Input({variant='form', ...props } : InputProps) {

    const variantStyles = {
        form: 'bg-black border border-gray-800 p-3 rounded-md outline-none focus:border-neon-green',
        none : 'focus:outline-none transition h-full flex-1 bg-transparent outline-none placeholder:text-slate-500'
    };

    const className = `w-full text-white p-0.5 ${variantStyles[variant]}`;

    return (
        <input 
            type="text"
            className={className}
            {...props}
        />
    )
}