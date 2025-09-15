import { NextRequest, NextResponse } from 'next/server';

// Free OCR via OCR.space public test key (no billing). Rate-limited and slower.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Prepare multipart form-data for OCR.space
    const upstream = new FormData();
    upstream.append('apikey', 'helloworld'); // public test key
    upstream.append('language', 'eng');
    upstream.append('isOverlayRequired', 'false');
    upstream.append('OCREngine', '2');
    upstream.append('scale', 'true');
    upstream.append('detectOrientation', 'true');
    upstream.append('isTable', 'true');
    upstream.append('file', new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' }), (file as any).name || 'upload');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: upstream as any,
      // Next.js will set correct headers for multipart automatically
    });

    let parsedText = '';
    if (res.ok) {
      const json = await res.json();
      parsedText = json?.ParsedResults?.[0]?.ParsedText || '';
      const errorMessage = json?.ErrorMessage || json?.ErrorDetails;
      if (!parsedText && (errorMessage || json?.IsErroredOnProcessing)) {
        console.warn('OCR.space returned no text:', errorMessage || 'No text');
      }
    } else {
      const errText = await res.text();
      console.error('OCR.space error:', errText);
    }

    // Fallback to server-side Tesseract only if OCR.space failed or returned empty
    if (!parsedText || String(parsedText).trim().length === 0) {
      try {
        const Tesseract: any = (await import('tesseract.js')).default;
        const buf = Buffer.from(await file.arrayBuffer());
        const { data } = await Tesseract.recognize(buf, 'eng', {
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: 6,
          user_defined_dpi: '300'
        });
        parsedText = (data?.text || '').trim();
      } catch (fallbackErr) {
        console.error('Tesseract fallback failed:', fallbackErr);
      }
    }

    if (!parsedText || String(parsedText).trim().length === 0) {
      return NextResponse.json({ error: 'No text found' }, { status: 422 });
    }

    return NextResponse.json({ text: String(parsedText).trim() });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR failed' }, { status: 500 });
  }
}
