interface InputProps {
    variant?: 'form' | 'none';
    placeholder?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
  }

export default function Input({variant='form', placeholder, value, onChange, readOnly } : InputProps) {

    const variantStyles = {
        form: 'bg-black border border-gray-800 p-3 rounded-md outline-none focus:border-neon-green',
        none : 'focus:outline-none transition h-full flex-1 bg-transparent outline-none placeholder:text-slate-500'
    };

    const className = `w-full text-white p-0.5 ${variantStyles[variant]}`;

    return (
        <input 
            type="text"
            value={value}
            placeholder={placeholder ? placeholder : '검색어를 입력하세요'}
            onChange={onChange}
            readOnly={readOnly}
            className={className}
        />
    )
}