import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductionDocModel } from '../production/types';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

export function generateCallSheetPDF(docData: ProductionDocModel) {
    const doc = new jsPDF();

    docData.days.forEach((day, index) => {
        if (index > 0) doc.addPage();

        const margin = 14;
        let y = margin;

        // --- Header ---
        doc.setFontSize(22);
        doc.text(`CALL SHEET - DAY ${day.dayNumber}`, 105, y, { align: 'center' });

        y += 10;
        doc.setFontSize(14);
        doc.text(`Project: ${docData.project.title}`, margin, y);

        doc.setFontSize(10);
        doc.text(`Date: ${day.shootDay.date}`, 150, y);

        y += 8;
        doc.text(`Call Time: ${day.shootDay.callTime}`, 150, y);
        doc.text(`Director: ${docData.project.director || '-'}`, margin, y);

        y += 6;
        doc.text(`Producer: ${docData.project.producer || '-'}`, margin, y);
        doc.text(`Loc: ${day.shootDay.mainLocation.name}`, 150, y);

        // --- Announcements ---
        if (day.announcements) {
            y += 10;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, 182, 12, 'F');
            doc.setFontSize(10);
            doc.setTextColor(200, 0, 0);
            doc.text(`NOTE: ${day.announcements}`, margin + 2, y + 2);
            doc.setTextColor(0, 0, 0);
            y += 10;
        } else {
            y += 10;
        }

        // --- Timetable ---
        y += 5;
        doc.setFontSize(12);
        doc.text("Schedule", margin, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['Time', 'Activity', 'Location', 'Dur']],
            body: day.timetable.map(t => [
                t.time,
                t.activityLabel + (t.memo ? `\n(${t.memo})` : ''),
                t.location || '',
                t.duration + 'm'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 20 }, 3: { cellWidth: 15 } }
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 15;

        // --- Scenes ---
        doc.setFontSize(12);
        doc.text("Scenes", margin, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['#', 'Slugline', 'I/E', 'D/N', 'Pages', 'Cast']],
            body: day.scenes.map(s => [
                s.order,
                s.sluglineTitle,
                s.intExt,
                s.dayNight,
                '1/8', // Mock
                s.characters.join(', ')
            ]),
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            styles: { fontSize: 9 }
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 15;

        // --- Cast Call ---
        // Check if page break needed
        if (y > 250) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.text("Cast Call", margin, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['Character', 'Actor', 'Call Time', 'Costume/Makeup']],
            body: day.castCalls.map(c => [
                c.characterName,
                c.actorName || 'TBD',
                c.callTime,
                'TBD'
            ]),
            theme: 'plain',
            headStyles: { fillColor: [200, 200, 200], textColor: 0 },
            styles: { fontSize: 9 }
        });
    });

    const filename = `CallSheet_${docData.project.title.replace(/\s+/g, '_')}_${docData.days[0].date}.pdf`;
    doc.save(filename);
}
