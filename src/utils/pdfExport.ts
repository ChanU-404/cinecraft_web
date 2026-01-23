import jsPDF from 'jspdf';
import { Scene, Shot } from '@/context/ScreenplayContext';

// Helper to load image as Base64 via Proxy
const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const proxyUrl = `/api/proxy-image`;
        const res = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        let data;
        try {
            data = await res.json();
        } catch (e) {
            // If JSON parsing fails (e.g. timeout HTML page), fall back to status
            if (!res.ok) throw new Error(`Proxy Status: ${res.status}`);
        }

        if (!res.ok || data?.error) {
            throw new Error(data?.error || `Proxy Status: ${res.status}`);
        }

        return data.base64 || "";
    } catch (e: any) {
        console.warn("Base64 fetch failed", e);
        throw new Error(e.message || "Proxy Error");
    }
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const loadKoreanFont = async (doc: jsPDF) => {
    try {
        const fontUrl = '/fonts/NanumGothic.ttf';
        const response = await fetch(fontUrl);
        if (!response.ok) throw new Error("Failed");
        const fontBuffer = await response.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontBuffer);
        doc.addFileToVFS('NanumGothic.ttf', fontBase64);
        doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
        doc.setFont('NanumGothic');
        return true;
    } catch (e) {
        console.error("Font load failed", e);
        return false;
    }
};

export const exportStoryboardPDF = async (scenesInput: Scene | Scene[], projectTitle: string = "CineCraft Screenplay") => {
    const scenes = Array.isArray(scenesInput) ? scenesInput : [scenesInput];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    await loadKoreanFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const margin = 10;

    // Layout Constants
    const headerHeight = 25;
    const rowHeight = 45;
    const shotsPerPage = 5;

    // Columns: [Cut (15mm)] [Video (75mm)] [Context (60mm)] [Audio (25mm)] [Time (15mm)]
    const colWidths = {
        cut: 15,
        video: 75,
        context: 60,
        audio: 25,
        time: 15
    };

    const colX = {
        cut: margin,
        video: margin + colWidths.cut,
        context: margin + colWidths.cut + colWidths.video,
        audio: margin + colWidths.cut + colWidths.video + colWidths.context,
        time: margin + colWidths.cut + colWidths.video + colWidths.context + colWidths.audio
    };

    // Flatten Shots
    interface FlatShot { scene: Scene; shot: Shot; shotIndex: number; }
    let allShots: FlatShot[] = [];
    scenes.forEach(scene => {
        scene.shots.forEach((shot, idx) => {
            allShots.push({ scene, shot, shotIndex: idx + 1 });
        });
    });

    const totalPages = Math.ceil(allShots.length / shotsPerPage);

    if (totalPages === 0) {
        doc.text("No shots to export.", margin, margin + 10);
        doc.save("Empty_Storyboard.pdf");
        return;
    }

    // 1. Pre-load all images with concurrency control to avoid timeouts/rate-limits
    const imageMap: Record<string, string> = {};
    const errorMap: Record<string, string> = {};
    const imageUrls = allShots
        .map(shot => shot.shot.selectedImageUrl)
        .filter((url): url is string => !!url);

    const uniqueUrls = [...new Set(imageUrls)];

    // Batch processing helper
    const BATCH_SIZE = 3;
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
        const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (url) => {
            try {
                const base64 = await getBase64FromUrl(url);
                if (base64) {
                    imageMap[url] = base64;
                } else {
                    errorMap[url] = "Empty Data";
                }
            } catch (err: any) {
                console.error(`Failed to load ${url}`, err);
                errorMap[url] = err.message || "Fetch Error";
            }
        }));
    }

    for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage();

        // -- Header Section --
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);

        doc.setFontSize(12);
        doc.setFont('NanumGothic', 'normal'); // Bold not strictly available in single TTF load
        doc.setTextColor(0, 0, 0);

        // Title/Team
        doc.text(`Title :  ${projectTitle}`, margin, margin + 8);
        doc.text(`Team :  CineCraft AI`, pageWidth - margin - 50, margin + 8);
        doc.text(`${p + 1}`, pageWidth - margin, margin + 8); // Page No

        // Thick separator line
        doc.setLineWidth(0.8);
        doc.line(margin, margin + 12, pageWidth - margin, margin + 12);

        // -- Table Header --
        const thY = margin + 15;
        const thHeight = 8;

        doc.setLineWidth(0.2);
        doc.rect(margin, thY, pageWidth - (margin * 2), thHeight);

        // Vertical Lines for Header
        doc.line(colX.video, thY, colX.video, thY + thHeight);
        doc.line(colX.context, thY, colX.context, thY + thHeight);
        doc.line(colX.audio, thY, colX.audio, thY + thHeight);
        doc.line(colX.time, thY, colX.time, thY + thHeight);

        // Header Text
        doc.setFontSize(9);
        doc.text("Cut", colX.cut + 1, thY + 5);
        doc.text("Video", colX.video + 2, thY + 5);
        doc.text("Context", colX.context + 2, thY + 5);
        doc.text("Audio", colX.audio + 2, thY + 5);
        doc.text("Time", colX.time + 1, thY + 5);

        // -- Rows --
        const startY = thY + thHeight;
        const pageShots = allShots.slice(p * shotsPerPage, (p + 1) * shotsPerPage);

        for (let i = 0; i < shotsPerPage; i++) {
            const y = startY + (i * rowHeight);

            // Draw Row Grid
            doc.rect(margin, y, pageWidth - (margin * 2), rowHeight);
            doc.line(colX.video, y, colX.video, y + rowHeight);
            doc.line(colX.context, y, colX.context, y + rowHeight);
            doc.line(colX.audio, y, colX.audio, y + rowHeight);
            doc.line(colX.time, y, colX.time, y + rowHeight);

            // Content
            if (i < pageShots.length) {
                const { scene, shot, shotIndex } = pageShots[i];

                // 1. Cut
                doc.setFontSize(8);
                doc.setFont('NanumGothic', 'normal');
                const sceneIdText = doc.splitTextToSize(`${scene.id}`, colWidths.cut - 2);
                doc.text(sceneIdText, colX.cut + 1, y + 6);

                const textHeight = sceneIdText.length * 4;
                doc.text(`-${shotIndex}`, colX.cut + 1, y + 6 + textHeight);

                // 2. Video (Image)
                const imgPad = 2;
                const imgBoxW = colWidths.video - (imgPad * 2);
                const imgBoxH = rowHeight - (imgPad * 2);

                const targetAR = 16 / 9;
                let drawW = imgBoxW;
                let drawH = drawW / targetAR;

                if (drawH > imgBoxH) {
                    drawH = imgBoxH;
                    drawW = drawH * targetAR;
                }

                const imgX = colX.video + (colWidths.video - drawW) / 2;
                const imgY = y + (rowHeight - drawH) / 2;

                if (shot.selectedImageUrl && imageMap[shot.selectedImageUrl]) {
                    try {
                        // Pass undefined as format to let jsPDF auto-detect from data URL (PNG/JPEG)
                        doc.addImage(imageMap[shot.selectedImageUrl], imgX, imgY, drawW, drawH, undefined, 'FAST');
                    } catch (e: any) {
                        console.warn("Image add failed for", shot.selectedImageUrl, e);
                        doc.setFontSize(6);
                        doc.text(`(PDF Error: ${e.message})`, imgX, imgY + 10);
                    }
                } else if (shot.selectedImageUrl) {
                    // Image URL exists but fetch failed
                    doc.setFontSize(5);
                    const errorMsg = errorMap[shot.selectedImageUrl] || "Unknown Error";
                    const splitError = doc.splitTextToSize(`Error: ${errorMsg}`, drawW);
                    doc.text(splitError, imgX, imgY + 5);
                }

                // 3. Context
                doc.setFontSize(8);
                doc.setFont('NanumGothic', 'normal');
                const splitDesc = doc.splitTextToSize(shot.description, colWidths.context - 4);
                doc.text(splitDesc, colX.context + 2, y + 5);
            }
        }
    }

    // Sanitize filename: remove special characters that might break downloads
    const safeTitle = projectTitle.replace(/[^a-zA-Z0-9가-힣\-_]/g, '_').substring(0, 50);
    const filename = scenes.length > 1
        ? `${safeTitle}_Full_Storyboard.pdf`
        : `${safeTitle}_Scene_${String(scenes[0].id).replace(/[^a-zA-Z0-9가-힣\-_]/g, '_')}.pdf`;

    doc.save(filename);
};
