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

interface TextChunk { id: string; text: string }

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content?: string;
  answer?: string;
  chunks?: TextChunk[];
  citations?: string[];
}

export function TopicUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [questionById, setQuestionById] = useState<Record<string, string>>({});
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [processFullPdf, setProcessFullPdf] = useState(false);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokenize = (s: string) => normalize(s).split(/\s+/).filter(Boolean);
  const tf = (tokens: string[]) => {
    const map = new Map<string, number>();
    for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
    return map;
  };
  const cosine = (a: Map<string, number>, b: Map<string, number>) => {
    let dot = 0, a2 = 0, b2 = 0;
    a.forEach((v, k) => { a2 += v * v; if (b.has(k)) dot += v * (b.get(k) as number); });
    b.forEach(v => { b2 += v * v; });
    if (!a2 || !b2) return 0;
    return dot / (Math.sqrt(a2) * Math.sqrt(b2));
  };
  const scoreSimilarity = (query: string, passage: string) => cosine(tf(tokenize(query)), tf(tokenize(passage)));

  const chunkText = (text: string, size = 900, overlap = 150): TextChunk[] => {
    const chunks: TextChunk[] = [];
    if (!text) return chunks;
    let start = 0;
    const len = text.length;
    while (start < len) {
      const end = Math.min(start + size, len);
      const slice = text.slice(start, end);
      chunks.push({ id: Math.random().toString(36).slice(2), text: slice.trim() });
      if (end === len) break;
      start = end - overlap;
      if (start < 0) start = 0;
    }
    return chunks;
  };

  const readTextFile = async (file: File): Promise<string | undefined> => {
    const text = await new Response(file).text();
    return text;
  };

  const extractPdfText = async (file: File): Promise<string | undefined> => {
    try {
      const pdfjs: any = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = (pdfjs as any).getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      const maxPages = processFullPdf ? pdf.numPages : Math.min(pdf.numPages, 20);
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const strings = textContent.items.map((it: any) => (it.str || '')).join(' ');
        fullText += strings + '\n';
      }
      return fullText.trim();
    } catch (e) {
      console.error('PDF extract error:', e);
      return undefined;
    }
  };

  const extractImageText = async (file: File): Promise<string | undefined> => {
    try {
      const Tesseract: any = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(file, 'eng');
      return (data?.text || '').trim();
    } catch (e) {
      console.error('OCR error:', e);
      return undefined;
    }
  };

  const readFileContent = async (file: File): Promise<string | undefined> => {
    if (file.type === 'text/plain') {
      return await readTextFile(file);
    }
    if (file.type === 'application/pdf') {
      return await extractPdfText(file);
    }
    if (file.type.startsWith('image/')) {
      return await extractImageText(file);
    }
    return undefined;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    
    for (const file of acceptedFiles) {
      try {
        const content = await readFileContent(file);
        const chunks = content ? chunkText(content) : undefined;
        
        setUploadedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          content,
          chunks
        }]);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to process file. Please try again.');
      }
    }
    setUploading(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    setQuestionById(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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

  const askQuestion = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.content) {
      setAnswerError('This file has no extracted text to query.');
      return;
    }
    const q = questionById[fileId]?.trim();
    if (!q) return;
    try {
      setIsAnswering(true);
      setAnswerError(null);

      const candidateChunks = file.chunks && file.chunks.length > 0 ? file.chunks : [{ id: 'all', text: file.content }];
      const rankedPairs = candidateChunks
        .map(c => ({ c, s: scoreSimilarity(q, c.text) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);
      const ranked = rankedPairs.map(x => x.c.text);
      const context = ranked.join('\n\n---\n\n').slice(0, 8000);

      const resp = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'QA failed');
      }
      const data = await resp.json();
      const answer = data.answer || 'No answer';
      setUploadedFiles(prev => prev.map(f => f.id === fileId ? { ...f, answer, citations: ranked } : f));
    } catch (e) {
      setAnswerError(e instanceof Error ? e.message : 'Failed to get answer.');
    } finally {
      setIsAnswering(false);
    }
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
            <Lottie 
              animationData={uploadAnimation} 
              loop={true}
              autoplay={true}
            />
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
            {isDragActive
              ? 'Drop your files here...'
              : 'Drag & drop your files here, or click to select'}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Supports: PDF, TXT, Images (PNG, JPG, GIF)
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={processFullPdf}
              onChange={(e) => setProcessFullPdf(e.target.checked)}
            />
            Process full PDF (may be slow)
          </label>
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
                          Content preview: {file.content.slice(0, 100)}...
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
                {file.content && (
                  <div className="p-4 border-t dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ask questions about this file (cloud AI)</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={questionById[file.id] || ''}
                        onChange={(e) => setQuestionById(prev => ({ ...prev, [file.id]: e.target.value }))}
                        placeholder="Type your question..."
                        className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                      />
                      <button
                        onClick={() => askQuestion(file.id)}
                        disabled={isAnswering}
                        className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm disabled:bg-blue-300"
                      >
                        {isAnswering ? 'Thinking...' : 'Ask'}
                      </button>
                    </div>
                    {answerError && (
                      <p className="text-xs text-red-500 mt-2">{answerError}</p>
                    )}
                    {file.answer && (
                      <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {file.answer}
                      </div>
                    )}
                    {file.citations && file.citations.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Citations</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {file.citations.map((c, i) => (
                            <li key={i} className="text-xs text-gray-500 dark:text-gray-400">
                              {c.slice(0, 200)}{c.length > 200 ? '…' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 mt-2">Uses retrieval over your document and queries a free AI model (configure key in .env).</p>
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