import ExcelJS from 'exceljs';
import { ProductionDocModel } from '../production/types';

export const generateScheduleXLSX = async (docData: ProductionDocModel) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Shooting Schedule');

    // --- Styles ---
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2c3e50' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };

    // --- Header Info ---
    sheet.getColumn('A').width = 10;
    sheet.getColumn('B').width = 30; // Scene
    sheet.getColumn('C').width = 10; // I/E
    sheet.getColumn('D').width = 10; // D/N
    sheet.getColumn('E').width = 20; // Cast
    sheet.getColumn('F').width = 40; // Synopsis

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `SHOOTING SCHEDULE - ${docData.project.title}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value = `Date: ${docData.shootDay.date} | Call Time: ${docData.shootDay.callTime} | Location: ${docData.shootDay.mainLocation.name}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // --- Table Header ---
    const startRow = 4;
    const headers = ['Order', 'Scene / Slugline', 'INT/EXT', 'DAY/NIGHT', 'Cast', 'Synopsis/Notes'];
    sheet.getRow(startRow).values = headers;

    headers.forEach((_, idx) => {
        const cell = sheet.getRow(startRow).getCell(idx + 1);
        cell.style = headerStyle;
    });

    // --- Data Rows ---
    docData.scenes.forEach((scene, idx) => {
        const row = sheet.getRow(startRow + 1 + idx);
        row.values = [
            scene.order,
            `${scene.sceneNumber}. ${scene.sluglineTitle}`,
            scene.intExt,
            scene.dayNight,
            scene.characters.join(', '),
            scene.synopsis + (scene.notes ? `\n[Note]: ${scene.notes}` : '')
        ];

        // Wrap text
        row.getCell(6).alignment = { wrapText: true };
        row.getCell(2).alignment = { wrapText: true };
    });

    // --- Cast Call Section (Below) ---
    const castRowStart = startRow + docData.scenes.length + 3;
    sheet.getCell(`A${castRowStart}`).value = "CAST CALL TIMES";
    sheet.getCell(`A${castRowStart}`).font = { bold: true };

    docData.castCalls.forEach((cast, idx) => {
        const r = sheet.getRow(castRowStart + 1 + idx);
        r.getCell(1).value = cast.characterName;
        r.getCell(2).value = cast.actorName || 'TBD';
        r.getCell(3).value = cast.callTime;
    });

    // --- Export ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Trigger download (Client-side usage)
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Schedule_${docData.project.title}_${docData.shootDay.date}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};
