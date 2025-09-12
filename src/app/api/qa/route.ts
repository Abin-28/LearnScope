import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = context
      ? `Answer strictly based on the given context. If unknown, say you are not sure.\n\nContext:\n${context}\n\nQuestion: ${question}`
      : question;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error('QA failed:', error);
    return NextResponse.json({ error: 'QA failed' }, { status: 500 });
  }
}
