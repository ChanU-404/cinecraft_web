import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    console.log(`[Proxy] Processing URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`[Proxy] Failed to fetch: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        console.log(`[Proxy] Success: ${contentType}, ${buffer.length} bytes`);

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(buffer, { headers });
    } catch (error) {
        console.error('[Proxy] Error:', error);
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
