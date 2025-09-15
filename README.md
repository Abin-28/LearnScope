# AI Learning Platform

A comprehensive educational platform that combines intelligent search capabilities with document-based Q&A functionality. This platform allows users to search the web for educational content and upload documents for AI-powered question answering.

## 🚀 Features

### 🔍 Intelligent Search System
- **Multi-source Search**: Integrates Wikipedia, Google Images, and YouTube videos
- **Smart Filtering**: Filter results by type (All, Text, Images, Videos)
- **Dynamic Layout**: 
  - Text results: Full-width with enhanced Wikipedia content display
  - Image results: 2-column grid (6 images for Image toggle, 5 for All toggle)
  - Video results: 2-column grid with embedded YouTube videos
- **Real-time Search**: Instant search with loading states and error handling
- **Responsive Design**: Optimized for desktop and mobile devices

### 📄 Document Upload & Q&A
- **Multi-format Support**: PDF, images (JPG, PNG, GIF), and text files
- **OCR Processing**: Automatic text extraction from images using Tesseract.js
- **AI-Powered Q&A**: Google Gemini integration for intelligent question answering
- **Context-Aware Responses**: Answers based on uploaded document content
- **Interactive Chat**: Real-time conversation interface with chat history

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.0.4** - React framework with App Router
- **React 19.0.0** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Icons** - Icon components
- **React Dropzone** - File upload handling

### Backend & APIs
- **Next.js API Routes** - Serverless API endpoints
- **Google Generative AI (Gemini)** - AI question answering
- **OpenAI API** - Additional AI capabilities
- **Tesseract.js** - OCR for image text extraction
- **PDF.js** - PDF text extraction

### External Services
- **Wikipedia API** - Text content and summaries
- **Google Images** - Image search results
- **YouTube/Piped API** - Video content
- **Unsplash** - Fallback image service

## 📁 Project Structure

```
LearnScope/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── qa/route.ts          # Q&A API endpoint
│   │   │   └── search/route.ts      # Search API endpoint
│   │   ├── fonts/                   # Custom fonts (Geist)
│   │   ├── globals.css              # Global styles
│   │   ├── layout.js                # Root layout
│   │   └── page.js                  # Main page component
│   └── components/
│       ├── Search/
│       │   └── index.tsx            # Basic search component
│       ├── SearchWithSidebar/
│       │   └── index.tsx            # Advanced search with sidebar
│       ├── TopicUploader/
│       │   └── index.tsx            # Document upload & processing
│       └── UploadChat/
│           └── index.tsx            # Chat interface for Q&A
├── next.config.mjs                  # Next.js configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 How It Works

### Search System
1. **User Input**: Enter search query in the sidebar
2. **API Processing**: 
   - Wikipedia API for text content
   - Google Images API for visual content
   - YouTube/Piped API for video content
3. **Result Processing**: Filter and format results based on type
4. **Display**: Render results in appropriate layout (grid/list)

### Document Upload & Q&A
1. **File Upload**: Drag & drop or select files (PDF, images, text)
2. **Text Extraction**: 
   - PDF: Extract text using PDF.js
   - Images: OCR processing with Tesseract.js
   - Text files: Direct reading
3. **AI Processing**: Send extracted text to Gemini API
4. **Q&A Interface**: Interactive chat for asking questions
5. **Context-Aware Responses**: AI answers based on document content

### Search Features Explained

#### Search Sidebar
- **Search Input**: Real-time search with Enter key support
- **Filter Toggles**: 
  - **All**: Shows 5 images + all text/video results
  - **Text**: Full-width Wikipedia articles with enhanced formatting
  - **Image**: 2-column grid showing 6 images
  - **Video**: 2-column grid with embedded YouTube videos

#### Upload Sidebar
- **File Drop Zone**: Drag & drop interface with visual feedback
- **Supported Formats**: PDF, JPG, PNG, GIF, TXT
- **Processing Status**: Real-time upload and extraction progress
- **Chat History**: Conversation log with user questions and AI responses

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for Q&A | Yes |
| `OPENAI_API_KEY` | OpenAI API key (optional) | No |

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full sidebar + main content layout
- **Tablet**: Adaptive grid layouts
- **Mobile**: Stacked layout with collapsible sidebar

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Static export with API routes
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment
