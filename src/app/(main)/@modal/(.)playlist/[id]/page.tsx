import ModalWrap from "@/components/ui/molecules/ModalWrap";
import MusicListDetailPage from '../../../_components/MusicListDetailPage';

export default async function PlaylistModalPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    return (
      <ModalWrap showCloseButton>
        <MusicListDetailPage id={id} kind="playlist" isModalContext />
      </ModalWrap>
    );
  }
