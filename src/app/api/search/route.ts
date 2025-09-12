import { NextRequest, NextResponse } from 'next/server';

async function searchWikipedia(query: string) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
  const searchRes = await fetch(searchUrl, { next: { revalidate: 60 } });
  const searchData = await searchRes.json();

  const first = searchData?.query?.search?.[0];
  if (!first) return null;

  const title = first.title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const sumRes = await fetch(summaryUrl, { next: { revalidate: 60 } });
  const sum = await sumRes.json();

  return {
    type: 'text' as const,
    title: sum?.title || title,
    description: sum?.extract || first.snippet?.replace(/<[^>]+>/g, ''),
    url: sum?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
  };
}

async function searchWikimediaImages(query: string) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=imageinfo&iiprop=url&format=json&origin=*`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values<any>(data.query.pages) : [];
    return pages
      .map((p: any) => p?.imageinfo?.[0]?.url)
      .filter(Boolean)
      .map((imgUrl: string) => ({
        type: 'image' as const,
        title: query,
        url: imgUrl,
      }));
  } catch {
    return [];
  }
}

async function tryPipedInstance(instanceBase: string, query: string) {
  try {
    const url = `${instanceBase}/api/v1/search?q=${encodeURIComponent(query)}&region=US`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return [];
    }
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return items
      .filter((it: any) => it.type === 'video')
      .slice(0, 3)
      .map((v: any) => ({
        type: 'video' as const,
        title: v.title,
        description: v.uploader,
        url: `https://www.youtube.com/embed/${v.id}`,
        thumbnail: v.thumbnail
      }));
  } catch {
    return [];
  }
}

async function searchYouTubePiped(query: string) {
  const instances = [
    'https://piped.video',
    'https://piped.projectsegfau.lt',
    'https://piped.videoapi.site'
  ];
  for (const base of instances) {
    const videos = await tryPipedInstance(base, query);
    if (videos.length > 0) return videos;
  }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const [analysis, videos, images] = await Promise.all([
      searchWikipedia(query),
      searchYouTubePiped(query),
      searchWikimediaImages(query)
    ]);

    const results = [
      ...(analysis ? [analysis] : []),
      ...videos,
      ...images
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
} 