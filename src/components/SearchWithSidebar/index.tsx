"use client";

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

type ResultType = 'text' | 'video' | 'image';

interface SearchResult {
  type: ResultType;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
}

export default function SearchWithSidebar() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ResultType | 'all'>("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      const safe: SearchResult[] = Array.isArray(data?.results) ? data.results : [];
      setResults(safe);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter(r => filter === 'all' ? true : r.type === filter);
  const hasVideos = results.some(r => r.type === 'video');
  const hasImages = results.some(r => r.type === 'image');

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r dark:border-gray-700 p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Search</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search the web..."
              className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            />
            <button onClick={doSearch} className="px-3 py-2 rounded-md bg-blue-600 text-white"><FiSearch /></button>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(['all','text','image','video'] as const).map(t => (
              <button key={t}
                onClick={() => setFilter(t as any)}
                className={`px-3 py-2 rounded-md text-sm border dark:border-gray-700 ${filter===t? 'bg-blue-600 text-white':'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'}`}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {loading && (<div className="flex justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>)}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'video' && !hasVideos ? (
              <div>
                No videos from the current Piped instance. Try again or switch to All.
                <button onClick={doSearch} className="ml-2 underline">Retry</button>
              </div>
            ) : filter === 'image' && !hasImages ? (
              <div>
                No images found via Wikimedia. Try a broader query or All.
                <button onClick={doSearch} className="ml-2 underline">Retry</button>
              </div>
            ) : (
              <p>Search results will appear here.</p>
            )}
          </div>
        )}
        <div className="space-y-6">
          {filtered.map((item, index) => (
            <div key={`${item.url}-${index}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {item.type === 'video' && (
                <div className="aspect-video">
                  {item.url.includes('youtube.com/embed') ? (
                    <iframe src={item.url} className="w-full h-full" allowFullScreen/>
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎥</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Video Search Result</p>
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View on {item.url.includes('pexels') ? 'Pexels' : 'Pixabay'}</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {item.type === 'image' && (
                <div className="relative">
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center hidden">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Image failed to load</p>
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Original</a>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                {item.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{item.description}</p>
                )}
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 mt-2 inline-block hover:underline">
                  {item.type === 'video' ? 'Watch Video' : item.type === 'image' ? 'View Image' : 'Open'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


