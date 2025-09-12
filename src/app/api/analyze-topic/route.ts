import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get('topic');

    if (!uploadedFile || !(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    let content = '';
    try {
      if (uploadedFile.type === 'text/plain') {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        content = new TextDecoder().decode(arrayBuffer);
      } else if (uploadedFile.type === 'application/pdf') {
        content = `Processing PDF: ${uploadedFile.name}`;
      } else if (uploadedFile.type.startsWith('image/')) {
        content = `Processing Image: ${uploadedFile.name}`;
      }
    } catch (error) {
      console.error('Error reading file:', error);
      content = `Processing file: ${uploadedFile.name}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert teacher. Analyze the given topic and provide a structured lesson plan with relevant examples, key points, and suggested visual aids."
        },
        {
          role: "user",
          content: content || `Analyze the topic from: ${uploadedFile.name}`
        }
      ]
    });

    return NextResponse.json({
      success: true,
      analysis: completion.choices[0].message.content,
      fileName: uploadedFile.name,
      fileType: uploadedFile.type
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
} 