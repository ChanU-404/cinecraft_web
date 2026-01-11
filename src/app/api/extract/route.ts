import { NextRequest, NextResponse } from 'next/server';
const pdfParseLib = require('pdf-parse');
const pdfParse = pdfParseLib.default || pdfParseLib;

export async function POST(req: NextRequest) {
    console.log("POST /api/extract received");
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
        console.log(`Extracting PDF: ${file.name}, size: ${file.size}, buffer len: ${buffer.length}`);

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

    } catch (error: any) {
        console.error('File extraction error:', error);

        // Handle specific PDFJS errors if possible
        const errorMessage = error.message || 'Failed to extract text from PDF.';
        const isCorrupted = errorMessage.toLowerCase().includes('format') || errorMessage.toLowerCase().includes('xref');

        return NextResponse.json(
            {
                error: isCorrupted
                    ? `PDF Parsing Error: The file might be corrupted or in an unsupported format. (${errorMessage})`
                    : errorMessage
            },
            { status: 500 }
        );
    }
}
