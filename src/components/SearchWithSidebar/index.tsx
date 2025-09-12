"use client";

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Image from 'next/image';

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
        body: JSON.stringify({ query, filter })
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

  const filtered = results.filter(r => {
    if (filter === 'all') {
      // For 'all' filter, limit images to 5
      if (r.type === 'image') {
        const imageResults = results.filter(result => result.type === 'image');
        return imageResults.indexOf(r) < 5;
      }
      return true;
    }
    if (r.type === filter) {
      // For image filter, limit to 6 images
      if (filter === 'image') {
        const imageResults = results.filter(result => result.type === 'image');
        return imageResults.indexOf(r) < 10;
      }
      return true;
    }
    return false;
  });

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r dark:border-gray-700 p-4 space-y-4 overflow-hidden">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">Search</label>
          <div className="mt-2 flex items-center gap-1">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search the web..."
              className="flex-1 px-2 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm min-w-0"
            />
            <button 
              onClick={doSearch} 
              disabled={loading}
              className="px-2 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FiSearch />
            </button>
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
            <p>Search results will appear here.</p>
          </div>
        )}
        <div className={filter === 'text' ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
          {filtered.map((item, index) => (
            <div key={`${item.url}-${index}`} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${item.type === 'text' && filter === 'text' ? 'border-l-4 border-blue-500' : ''}`}>
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
                  <Image 
                    src={item.url} 
                    alt={item.title} 
                    width={800}
                    height={256}
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
              {item.type === 'text' && filter === 'text' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Wikipedia Article</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Quick Summary</h4>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">{item.title}</h3>
                {item.description && (
                  <div className="mt-2 text-gray-600 dark:text-gray-400">
                    {item.type === 'text' && filter === 'text' ? (
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed">{item.description}</p>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source: Wikipedia</p>
                          <p className="text-sm leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{item.description}</p>
                    )}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
                    {item.type === 'video' ? 'Watch Video' : item.type === 'image' ? 'View Image' : 'Read More'}
                  </a>
                  {item.type === 'text' && filter === 'text' && (
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      Text Result
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


