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

async function searchGoogleImages(query: string) {
  try {
    // Google Images search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:m`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract image URLs from Google's JSON data
    const imageMatches = html.match(/\["https:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)"/g);
    if (!imageMatches) return [];
    
    return imageMatches.slice(0, 5).map((match, index) => {
      const url = match.replace(/^\["|"$/g, '');
      return {
        type: 'image' as const,
        title: `${query} - Image ${index + 1}`,
        url: url,
        thumbnail: url,
        description: `Images result for ${query}`
      };
    });
  } catch {
    return [];
  }
}

async function searchGoogleVideos(query: string) {
  try {
    // Google Videos search URL
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=vid`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract YouTube video IDs from Google's search results
    const videoMatches = html.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g);
    if (!videoMatches) return [];
    
    const uniqueVideoIds = Array.from(new Set(videoMatches.map(match => match.match(/v=([a-zA-Z0-9_-]{11})/)?.[1]).filter(Boolean)));
    
    return uniqueVideoIds.slice(0, 4).map((videoId, index) => ({
      type: 'video' as const,
      title: `${query} - Video ${index + 1}`,
      description: `Videos result for ${query}`,
      url: `https://www.youtube.com/embed/${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
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
      Promise.all([
        searchGoogleVideos(query),
        searchYouTubePiped(query)
      ]).then(results => results.flat()),
      searchGoogleImages(query)
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