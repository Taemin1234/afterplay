import Link from 'next/link'

import Button from '@/components/ui/atoms/Button'

export default function LoggedOutUI() {
    return (
        <Link href="/auth/login">
            <Button variant={'outline'} size='sm' as="span">로그인 / 회원가입</Button>
        </Link>
    )
}