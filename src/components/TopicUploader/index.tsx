"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import { FiFile, FiImage, FiX } from 'react-icons/fi';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Import animation
const uploadAnimation = {
  "v": "5.7.1",
  "fr": 29.9700012207031,
  "ip": 0,
  "op": 60.0000024438501,
  "w": 512,
  "h": 512,
  "nm": "Upload Animation",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Upload Arrow",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "p": { "a": 0, "k": [256, 256, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { 
          "a": 1,
          "k": [
            {
              "t": 0,
              "s": [100, 100, 100],
              "h": 1
            },
            {
              "t": 30,
              "s": [110, 110, 100],
              "h": 1
            },
            {
              "t": 60,
              "s": [100, 100, 100]
            }
          ]
        }
      },
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "d": 1,
              "s": { "a": 0, "k": [100, 160] },
              "p": { "a": 0, "k": [0, 0] },
              "r": { "a": 0, "k": 0 }
            }
          ]
        }
      ]
    }
  ]
};

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content?: string;
  analysis?: string;
}

export function TopicUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const readFileContent = async (file: File): Promise<string | undefined> => {
    if (file.type === 'text/plain') {
      const text = await new Response(file).text();
      return text;
    }
    return undefined;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('topic', file);

        const content = await readFileContent(file);
        
        const response = await fetch('/api/analyze-topic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        
        setUploadedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          content,
          analysis: data.analysis
        }]);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to upload topic. Please try again.');
      }
    }
    setUploading(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 5
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FiImage className="w-5 h-5" />;
    return <FiFile className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 
          transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="w-48 h-48">
            {typeof window !== 'undefined' && (
              <Lottie 
                animationData={uploadAnimation} 
                loop={true}
                autoplay={true}
              />
            )}
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
            {isDragActive
              ? 'Drop your files here...'
              : 'Drag & drop your files here, or click to select'}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Supports: PDF, TXT, Images (PNG, JPG, GIF)
          </p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Uploaded Files
          </h3>
          <div className="space-y-6">
            {uploadedFiles.map(file => (
              <div 
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {file.name}
                      </p>
                      {file.content && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Content preview: {file.content.slice(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  >
                    <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                {file.analysis && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      AI Analysis
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {file.analysis}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-progress"></div>
          </div>
        </div>
      )}
    </div>
  );
} 