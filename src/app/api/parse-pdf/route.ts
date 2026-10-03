import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(uint8);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    return NextResponse.json({ text, numPages: totalPages });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
  }
}
