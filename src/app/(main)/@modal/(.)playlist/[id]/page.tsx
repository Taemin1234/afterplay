import ModalWrap from "@/components/ui/molecules/ModalWrap";
import MusicListDetailPage from '../../../_components/MusicListDetailPage';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PlaylistModalPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const userAgent = (await headers()).get('user-agent') ?? '';
    const isMobile = /Android|iPhone|iPod|IEMobile|Opera Mini|Mobile/i.test(userAgent);

    if (isMobile) {
      redirect(`/playlist/${id}`);
    }

    return (
      <ModalWrap>
        <MusicListDetailPage id={id} kind="playlist" />
      </ModalWrap>
    );
  }
