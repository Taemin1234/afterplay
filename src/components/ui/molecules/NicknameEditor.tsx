'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import Input from '@/components/ui/atoms/Input';
import IconButton from '@/components/ui/atoms/IconButton';

interface NicknameEditorProps {
    initialNickname: string;
}

export default function NicknameEditor({ initialNickname }: NicknameEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(initialNickname);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (nickname === initialNickname) return setIsEditing(false);

        setIsLoading(true);
        try {
            const res = await fetch('/api/user/nickname', {
                method: 'PATCH',
                body: JSON.stringify({ nickname }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                setIsEditing(false);
                // 페이지의 서버 데이터를 갱신하기 위해 새로고침
                window.location.reload();
            } else {
                alert('중복되거나 올바르지 않은 닉네임입니다.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {isEditing ? (
                <div className="flex items-center gap-2">
                    <Input
                        variant="form"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="새 닉네임"
                    />
                    <IconButton
                        icon={<Check className="text-neon-green" size={20} />}
                        onClick={handleUpdate}
                        disabled={isLoading}
                    />
                    <IconButton
                        icon={<X className="text-gray-500" size={20} />}
                        onClick={() => {
                            setNickname(initialNickname);
                            setIsEditing(false);
                        }}
                    />
                </div>
            ) : (
                <>
                    <p className="text-2xl font-bold text-white">{nickname}</p>
                    <IconButton icon={<Pencil size={18} />} onClick={() => setIsEditing(true)} />
                </>
            )}
        </div>
    );
}