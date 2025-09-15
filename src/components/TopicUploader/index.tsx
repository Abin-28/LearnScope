"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { FiFile, FiImage, FiSend, FiEye, FiInfo } from 'react-icons/fi';

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

interface ChatMessage { 
  role: 'user' | 'assistant'; 
  content: string; 
  citations?: string[];
  showPreview?: boolean;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  content: string;
  chunks: TextChunk[];
}

export function TopicUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processFullPdf, setProcessFullPdf] = useState(false);
  
  // Chat state
  const [currentDoc, setCurrentDoc] = useState<UploadedDocument | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const resetUploader = () => {
    setMessages([]);
    setInputMessage('');
    setIsAnswering(false);
    setShowFullPreview(false);
    setShowExtractedPreview(false);
    setError(null);
    setUploading(false);
    setProcessFullPdf(false);
    setCurrentDoc(prev => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

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
      // Import pdf.js, align worker version to library version, fallback to disableWorker
      const pdfjs: any = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      try {
        if ((pdfjs as any)?.GlobalWorkerOptions) {
          const ver = (pdfjs as any).version || '4.6.82';
          (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
        }
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
      } catch (primaryError) {
        // Retry without worker
        const loadingTask = (pdfjs as any).getDocument({ data: arrayBuffer, disableWorker: true });
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
      }
    } catch (e) {
      console.error('PDF extract error:', e);
      return undefined;
    }
  };

  const extractImageText = async (file: File): Promise<string | undefined> => {
    try {
      // Use server-side Google Vision API for better OCR accuracy
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`OCR API failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.text || '';
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
    
    try {
      const file = acceptedFiles[0]; // Only take first file
      const content = await readFileContent(file);
      
      if (!content) {
        setError('Could not extract text from this file.');
        return;
      }

      const chunks = chunkText(content);
      const url = URL.createObjectURL(file);
      const doc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        url,
        content,
        chunks
      };

      // Revoke previous object URL if any
      setCurrentDoc(prev => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return doc;
      });
      
      // Initialize chat with preview message
      setMessages([
        {
          role: 'assistant',
          content: `I've uploaded and processed your document: **${file.name}**\n\nClick "Preview" to see the full content, or ask me anything about it!`,
          showPreview: true
        }
      ]);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentDoc || isAnswering) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      setIsAnswering(true);

      // Get relevant chunks
      const candidateChunks = currentDoc.chunks && currentDoc.chunks.length > 0 ? currentDoc.chunks : [{ id: 'all', text: currentDoc.content }];
      const rankedPairs = candidateChunks
        .map(c => ({ c, s: scoreSimilarity(userMessage, c.text) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);
      const ranked = rankedPairs.map(x => x.c.text);
      const context = ranked.join('\n\n---\n\n').slice(0, 8000);

      const resp = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, context })
      });
      
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'QA failed');
      }
      
      const data = await resp.json();
      const answer = data.answer || 'No answer';
      
      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: answer, 
        citations: ranked 
      }]);
      
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${e instanceof Error ? e.message : 'Failed to get answer.'}` 
      }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FiImage className="w-5 h-5" />;
    return <FiFile className="w-5 h-5" />;
  };

  // Show upload screen if no document
  if (!currentDoc) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-6 relative
            transition-all duration-200 cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20' : 'border-gray-300 hover:border-blue-400 dark:border-gray-600'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <div className="w-32 h-32">
              <Lottie 
                animationData={uploadAnimation} 
                loop={true}
                autoplay={true}
              />
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">
              {isDragActive
                ? 'Drop your file here...'
                : 'Drag & drop your document here, or click to select'}
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
            
            <div className="mt-4 w-full">
              <div className="rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4">
                <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-200">
                  <FiInfo className="w-4 h-4" />
                  <span className="text-sm font-medium">Before you upload</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <li>
                    Upload <span className="font-medium">one file at a time</span>. Multiple documents are not supported yet.
                  </li>
                  <li>
                    PDFs: We extract up to <span className="font-medium">20 pages</span> by default.
                    Turn on <span className="font-medium">“Process full PDF”</span> to process everything (slower).
                  </li>
                  <li>
                    Images: Text is extracted via a <span className="font-medium">free OCR service</span>; avoid sensitive data. Large images may take longer.
                  </li>
                  <li>
                    Preview shows the <span className="font-medium">actual file</span>. Use <span className="font-medium">“Preview Extracted Text”</span> to verify OCR output.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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

  // Show chat interface
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-5">
        <div className="text-sm text-gray-600 dark:text-gray-300">Chatting about: <span className="font-medium">{currentDoc.name}</span></div>
        <button
          onClick={resetUploader}
          className="text-xs px-2 py-1 rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Upload new document"
        >
          Upload New Document
        </button>
      </div>
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              {message.showPreview && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(currentDoc.type)}
                    <span className="text-sm font-medium">{currentDoc.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Preview: {currentDoc.content.slice(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowFullPreview(!showFullPreview)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <FiEye className="w-3 h-3" />
                      {showFullPreview ? 'Hide' : 'Preview'} Full Document
                    </button>
                    <button
                      onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <FiEye className="w-3 h-3" />
                      {showExtractedPreview ? 'Hide' : 'Preview'} Extracted Text
                    </button>
                  </div>
                  {showFullPreview && (
                    <div className="mt-2">
                      {currentDoc.type === 'application/pdf' ? (
                        <iframe
                          src={currentDoc.url}
                          title={currentDoc.name}
                          className="w-full h-96 rounded border"
                          allow="fullscreen"
                        />
                      ) : currentDoc.type.startsWith('image/') ? (
                        <Image 
                          src={currentDoc.url} 
                          alt={currentDoc.name} 
                          width={800} 
                          height={600} 
                          className="max-h-96 w-auto rounded border" 
                          unoptimized
                        />
                      ) : (
                        <div className="p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs max-h-40 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{currentDoc.content}</pre>
                        </div>
                      )}
                    </div>
                  )}
                  {showExtractedPreview && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{currentDoc.content}</pre>
                    </div>
                  )}
                </div>
              )}
              
              {message.citations && message.citations.length > 0 && (
                <div className="mt-2 text-xs opacity-70">
                  <div className="font-medium mb-1">Sources:</div>
                  {message.citations.map((citation, idx) => (
                    <div key={idx} className="mb-1">
                      • {citation.slice(0, 120)}{citation.length > 120 ? '...' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isAnswering && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Ask anything about your document..."
            className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            disabled={isAnswering}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isAnswering}
            className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}