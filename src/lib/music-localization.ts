import type { MusicAliasType, Prisma } from '../../generated/prisma/client';
import prisma from '@/lib/prisma';

export type LocalizableMusicItem = {
  id: string;
  name: string;
  artist: string;
  albumImageUrl: string;
  artistId?: string;
  albumId?: string;
  spotifyName?: string;
  spotifyArtistName?: string;
  spotifyAlbumName?: string;
};

type MusicEntityType = 'track' | 'album' | 'artist';
type DbClient = Prisma.TransactionClient | typeof prisma;

function aliasTypeFor(entityType: MusicEntityType): MusicAliasType {
  if (entityType === 'track') return 'TRACK_TITLE';
  if (entityType === 'album') return 'ALBUM_TITLE';
  return 'ARTIST_NAME';
}

function cleanOptional(value: string | null | undefined) {
  return value?.trim() || undefined;
}

export async function registerMusicLocalizations(
  db: DbClient,
  itemType: 'track' | 'album',
  items: LocalizableMusicItem[]
) {
  const rows = new Map<
    string,
    { type: MusicAliasType; spotifyId: string; canonical: string; context?: string; imageUrl?: string }
  >();

  for (const item of items) {
    const canonicalName = cleanOptional(item.spotifyName) ?? item.name.trim();
    const canonicalArtist = cleanOptional(item.spotifyArtistName) ?? item.artist.trim();
    const imageUrl = cleanOptional(item.albumImageUrl);

    rows.set(`${aliasTypeFor(itemType)}:${item.id}`, {
      type: aliasTypeFor(itemType),
      spotifyId: item.id,
      canonical: canonicalName,
      context: canonicalArtist,
      imageUrl,
    });

    const albumId = cleanOptional(item.albumId);
    const albumName = cleanOptional(item.spotifyAlbumName);
    if (itemType === 'track' && albumId && albumName) {
      rows.set(`ALBUM_TITLE:${albumId}`, {
        type: 'ALBUM_TITLE',
        spotifyId: albumId,
        canonical: albumName,
        context: canonicalArtist,
        imageUrl,
      });
    }

    const artistId = cleanOptional(item.artistId);
    if (artistId && canonicalArtist) {
      rows.set(`ARTIST_NAME:${artistId}`, {
        type: 'ARTIST_NAME',
        spotifyId: artistId,
        canonical: canonicalArtist,
        context: itemType === 'album' ? canonicalName : albumName,
        imageUrl,
      });
    }
  }

  await Promise.all(
    [...rows.values()].map((row) =>
      db.musicSearchAlias.upsert({
        where: {
          type_spotifyId: {
            type: row.type,
            spotifyId: row.spotifyId,
          },
        },
        update: {
          canonical: row.canonical,
          context: row.context,
          imageUrl: row.imageUrl,
        },
        create: row,
      })
    )
  );
}

export async function getLocalizedNames(
  requests: Array<{ type: MusicAliasType; spotifyId?: string | null; canonical?: string | null }>
) {
  const spotifyIds = [...new Set(requests.map((request) => request.spotifyId).filter((value): value is string => Boolean(value)))];
  const canonicals = [...new Set(requests.map((request) => request.canonical).filter((value): value is string => Boolean(value)))];
  if (spotifyIds.length === 0 && canonicals.length === 0) return new Map<string, string>();

  const rows = await prisma.musicSearchAlias.findMany({
    where: {
      alias: { not: null },
      OR: [
        ...(spotifyIds.length > 0 ? [{ spotifyId: { in: spotifyIds } }] : []),
        ...(canonicals.length > 0 ? [{ canonical: { in: canonicals, mode: 'insensitive' as const } }] : []),
      ],
    },
    select: { type: true, spotifyId: true, canonical: true, alias: true },
  });

  const names = new Map<string, string>();
  for (const row of rows) {
    if (!row.alias) continue;
    if (row.spotifyId) names.set(`${row.type}:id:${row.spotifyId}`, row.alias);
    names.set(`${row.type}:name:${row.canonical.toLocaleLowerCase()}`, row.alias);
  }
  return names;
}

export function localizedName(
  names: Map<string, string>,
  type: MusicAliasType,
  spotifyId: string | null | undefined,
  canonical: string
) {
  if (spotifyId) return names.get(`${type}:id:${spotifyId}`) ?? canonical;
  return names.get(`${type}:name:${canonical.toLocaleLowerCase()}`) ?? canonical;
}

export async function expandSpotifySearchQueries(query: string, itemType: MusicEntityType) {
  const normalizedQuery = query.trim();
  const relevantTypes: MusicAliasType[] = [aliasTypeFor(itemType), 'ARTIST_NAME', 'TRACK_ARTIST', 'ALBUM_ARTIST'];
  const rows = await prisma.musicSearchAlias.findMany({
    where: {
      type: { in: relevantTypes },
      alias: { not: null },
      OR: [
        { canonical: { contains: normalizedQuery, mode: 'insensitive' } },
        { alias: { contains: normalizedQuery, mode: 'insensitive' } },
      ],
    },
    select: { canonical: true, alias: true },
    take: 5,
  });

  const terms = new Set<string>();
  for (const row of rows) {
    if (row.alias?.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase())) {
      terms.add(row.canonical);
    }
  }
  terms.add(normalizedQuery);
  return [...terms];
}
