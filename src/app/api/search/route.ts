import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function searchYouTube(query: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(
      query
    )}&key=${YOUTUBE_API_KEY}`
  );
  const data = await response.json();
  
  return data.items.map((item: any) => ({
    type: 'video',
    title: item.snippet.title,
    description: item.snippet.description,
    url: `https://www.youtube.com/embed/${item.id.videoId}`,
    thumbnail: item.snippet.thumbnails.high.url,
  }));
}

async function searchImages(query: string) {
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(
      query
    )}&searchType=image&num=3`
  );
  const data = await response.json();
  
  return data.items.map((item: any) => ({
    type: 'image',
    title: item.title,
    url: item.link,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // Get AI analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable teacher. Provide a concise explanation of the topic."
        },
        {
          role: "user",
          content: query
        }
      ]
    });

    const analysis = {
      type: 'text',
      title: 'AI Analysis',
      description: completion.choices[0].message.content,
      url: '#'
    };

    // Get related videos and images
    const [videos, images] = await Promise.all([
      searchYouTube(query),
      searchImages(query)
    ]);

    return NextResponse.json({
      results: [analysis, ...videos, ...images]
    });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
} 