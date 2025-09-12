"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import Image from 'next/image';

interface SearchResult {
  type: 'text' | 'video' | 'image';
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
}

const MotionDiv = motion.div;

export function Search() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.error('Search failed with status:', response.status);
        setResults([]);
        return;
      }

      const data = await response.json();
      const safeResults: SearchResult[] = Array.isArray(data?.results) ? data.results : [];
      setResults(safeResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <MotionDiv 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for any topic..."
            className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 pr-12"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiSearch className="w-6 h-6" />
          </button>
        </div>
      </MotionDiv>

      <AnimatePresence>
        {isSearching && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex justify-center"
          >
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </MotionDiv>
        )}
      </AnimatePresence>

      <MotionDiv 
        layout
        className="mt-8 space-y-6"
      >
        {results.map((result, index) => (
          <MotionDiv
            key={result.url}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
          >
            {result.type === 'video' && (
              <div className="aspect-video">
                <iframe
                  src={result.url}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
            {result.type === 'image' && (
              <Image
                width={800}
                height={256}
                src={result.url}
                alt={result.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {result.title}
              </h3>
              {result.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {result.description}
                </p>
              )}
            </div>
          </MotionDiv>
        ))}
      </MotionDiv>
    </div>
  );
} 