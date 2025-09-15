"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const SearchWithSidebar = dynamic(() => import('../components/SearchWithSidebar'), { ssr: false });
const UploadChat = dynamic(() => import('../components/UploadChat'), { ssr: false });

export default function Home() {
  const [active, setActive] = useState('search');
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LearnScope - AI Learning Platform</h1>
          <div className="flex gap-2">
            <button onClick={() => setActive('search')} className={`px-3 py-2 rounded-md text-sm ${active==='search'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 border dark:border-gray-700'}`}>Search</button>
            <button onClick={() => setActive('upload')} className={`px-3 py-2 rounded-md text-sm ${active==='upload'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 border dark:border-gray-700'}`}>Upload Document</button>
          </div>
        </div>
        <div className="h-[calc(100vh-140px)] bg-white/50 dark:bg-gray-900/40 rounded-xl overflow-hidden border dark:border-gray-800">
          {active === 'search' ? <SearchWithSidebar /> : <UploadChat />}
        </div>
      </div>
    </div>
  );
}
