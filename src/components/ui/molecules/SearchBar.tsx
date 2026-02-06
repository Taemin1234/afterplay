"use client"

import { Search } from 'lucide-react'
import { useState } from 'react'

import Input from '../atoms/Input'
import IconButton from '../atoms/IconButton'

export default function SearchBar() {
    const [text, setText] = useState<string>('')

    const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
    }

    const onClickButton = () => {
        console.log(text)
    }

    return (
        <div className='flex h-11 w-full items-center rounded-full border px-3 border-slate-700 bg-slate-900/60 transition focus-within:border-[#39ff14] focus-within:ring-2 focus-within:ring-[#39ff14]/25'>
            <Input placeholder='검색어를 입력하세요' value={text} onChange={onChangeInput} className='h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500'/>
            <IconButton icon={<Search className='h-5 w-5' />} onClick={onClickButton}/>
        </div>
    )
}