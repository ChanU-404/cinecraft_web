import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionDocModel } from '../production/types';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export const generateCallSheetPDF = (docData: ProductionDocModel) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    // Font setup (using standard fonts for MVP to avoid loading complexity, or reuse existing NanumGothic loader if global)
    // For MVP reliability, standard font or minimal Korean support if loaded

    const margin = 14;
    let y = margin;

    // --- Header ---
    doc.setFontSize(22);
    doc.text("CALL SHEET", 105, y, { align: 'center' });

    y += 10;
    doc.setFontSize(14);
    doc.text(`Project: ${docData.project.title}`, margin, y);
    doc.setFontSize(10);
    doc.text(`Date: ${docData.shootDay.date}`, 150, y);

    y += 8;
    doc.text(`Call Time: ${docData.shootDay.callTime}`, margin, y);
    doc.text(`Location: ${docData.shootDay.mainLocation.name}`, 150, y);

    y += 12; // Spacing

    // --- Announcements ---
    if (docData.announcements) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 182, 12, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text(`NOTE: ${docData.announcements}`, margin + 2, y + 8);
        y += 18;
    }

    doc.setTextColor(0);

    // --- Timetable ---
    doc.setFontSize(12);
    doc.text("SCHEDULE", margin, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        head: [['Time', 'Activity', 'Location', 'Notes']],
        body: docData.timetable.map(t => [
            t.time,
            t.activityLabel,
            t.location || '-',
            t.memo || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;

    // --- Scenes ---
    doc.setFontSize(12);
    doc.text("SCENES", margin, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        head: [['#', 'Scene', 'Set', 'D/N', 'Cast', 'Pages/Est']],
        body: docData.scenes.map(s => [
            s.order,
            `${s.sluglineTitle}\n${s.synopsis.substring(0, 50)}`,
            s.intExt,
            s.dayNight,
            s.characters.join(', '),
            `${s.estimatedDuration} min`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [50, 50, 50] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 1: { cellWidth: 80 } }, // Scene column wider
        margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 10;

    // --- Cast ---
    // Check if enough space, else add page
    if (y > 250) {
        doc.addPage();
        y = margin;
    }

    doc.setFontSize(12);
    doc.text("CAST CALL", margin, y);
    y += 2;

    autoTable(doc, {
        startY: y,
        head: [['Character', 'Actor', 'Call Time', 'Notes']],
        body: docData.castCalls.map(c => [
            c.characterName,
            c.actorName || 'TBD',
            c.callTime,
            [c.costume, c.makeup].filter(Boolean).join(' / ')
        ]),
        theme: 'plain',
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
    });

    // Save
    const safeTitle = docData.project.title.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${safeTitle}_CallSheet_${docData.shootDay.date}.pdf`);
};
