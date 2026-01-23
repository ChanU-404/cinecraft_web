import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    // console.log(`[Proxy] Processing URL: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a standard browser to avoid blocking
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`[Proxy] Upstream Error: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: `Upstream error: ${response.statusText}` }, { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/png';

        // Convert to Base64
        const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;

        // console.log(`[Proxy] Success: ${buffer.length} bytes -> Base64`);

        return NextResponse.json({ base64 });
    } catch (error: any) {
        console.error('[Proxy] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
