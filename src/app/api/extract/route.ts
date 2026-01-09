import { NextRequest, NextResponse } from 'next/server';
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.default || pdfParseLib;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!file.name.endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Strict Policy: Only .pdf files are accepted. Please export your screenplay to PDF.' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdfParse(buffer);
        let text = data.text;

        // Basic Normalization (Minimal)
        // 1. Remove page numbers (simple lines with just digits)
        // 2. Normalize newlines
        const lines = text.split('\n');
        const cleanedLines = lines
            .filter((line: string) => !/^\s*\d+\.?\s*$/.test(line)) // Remove lines like "1", " 24 ", "12."
            .map((line: string) => line.trimEnd()); // Trim trailing spaces

        const normalizedText = cleanedLines.join('\n')
            .replace(/\n{3,}/g, '\n\n'); // Max 2 newlines

        if (!normalizedText.trim()) {
            return NextResponse.json(
                { error: 'No text extracted. Ensure this is a digital PDF, not a scan.' },
                { status: 422 }
            );
        }

        return NextResponse.json({ text: normalizedText });

    } catch (error) {
        console.error('File extraction error:', error);
        return NextResponse.json(
            { error: 'Failed to extract text from PDF.' },
            { status: 500 }
        );
    }
}
