'use client';

import { Search, X } from 'lucide-react';

import IconButton from '../atoms/IconButton';
import Input from '../atoms/Input';

interface SearchBarProps {
  variant?: 'primary' | 'danger' | 'form';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'md' | 'full';
  mode?: 'input' | 'ui';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  onClear?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

const variantStyles = {
  primary: 'border-slate-700 bg-slate-900/60 focus-within:border-[#39ff14] focus-within:ring-2 focus-within:ring-[#39ff14]/25',
  form: 'bg-black border border-gray-800 p-3 rounded-md text-white outline-none focus:border-neon-green resize-none',
  danger: 'bg-red-500 text-white hover:bg-red-600',
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

export default function SearchBar({
  variant = 'primary',
  size = 'md',
  rounded = 'full',
  mode = 'input',
  placeholder = '검색어를 입력하세요',
  value,
  onChange,
  onClick,
  onClear,
  onKeyDown,
  autoFocus = false,
}: SearchBarProps) {
  const isModalMode = mode === 'ui';
  const hasValue = typeof value === 'string' && value.length > 0;

  const handleClear = () => {
    if (onClear) {
      onClear();
      return;
    }

    if (onChange) {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const className = `flex h-11 w-full items-center border px-3 transition ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles[rounded]}`;

  return (
    <div onClick={isModalMode ? onClick : undefined} className={className}>
      <Input
        variant='none'
        placeholder={placeholder}
        value={value}
        onChange={isModalMode ? undefined : onChange}
        readOnly={isModalMode}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
      {!isModalMode && hasValue && <IconButton icon={<X size={10} />} onClick={handleClear} variant='bg' className='w-4! h-4! sm:w-4! sm:h-4!' />}
      <IconButton icon={<Search size={20} />} onClick={onClick} />
    </div>
  );
}
