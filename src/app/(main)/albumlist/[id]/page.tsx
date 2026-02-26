import MusicListDetailPage from '../../_components/MusicListDetailPage';

export default async function AlbumListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MusicListDetailPage id={id} kind="albumlist" />;
}
