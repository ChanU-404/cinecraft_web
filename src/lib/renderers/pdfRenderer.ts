import { ProductionDocModel } from '../production/types';

// Call Sheet PDF using browser print
export function generateCallSheetPDF(docData: ProductionDocModel) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Call Sheet</title>
    <style>
        @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .info-left { flex: 1; }
        .info-right { text-align: right; }
        .note {
            background: #f0f0f0;
            padding: 8px;
            margin: 10px 0;
            color: #c80000;
            font-weight: bold;
        }
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin: 15px 0 8px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background: #0f172a;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            border-bottom: 1px solid #e0e0e0;
            padding: 6px 8px;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
    </style>
</head>
<body>
`;

    docData.days.forEach((day, index) => {
        if (index > 0) htmlContent += '<div class="page-break"></div>';

        htmlContent += `
<div class="header">CALL SHEET - DAY ${day.dayNumber}</div>
<div class="info-row">
    <div class="info-left">
        <div><strong>Project:</strong> ${docData.project.title}</div>
        <div><strong>Director:</strong> ${docData.project.director || '-'}</div>
        <div><strong>Producer:</strong> ${docData.project.producer || '-'}</div>
    </div>
    <div class="info-right">
        <div><strong>Date:</strong> ${day.shootDay.date}</div>
        <div><strong>Call Time:</strong> ${day.shootDay.callTime}</div>
        <div><strong>Location:</strong> ${day.shootDay.mainLocation.name}</div>
    </div>
</div>

${day.announcements ? `<div class="note">NOTE: ${day.announcements}</div>` : ''}

<div class="section-title">Schedule</div>
<table>
    <thead>
        <tr>
            <th style="width: 60px">Time</th>
            <th>Activity</th>
            <th style="width: 150px">Location</th>
            <th style="width: 60px">Dur</th>
        </tr>
    </thead>
    <tbody>
        ${day.timetable.map(block => `
        <tr>
            <td>${block.time}</td>
            <td>${block.activityLabel}${block.memo ? '<br><small>(' + block.memo + ')</small>' : ''}</td>
            <td>${block.location || ''}</td>
            <td>${block.duration}m</td>
        </tr>
        `).join('')}
    </tbody>
</table>

<div class="section-title">Scenes</div>
<table>
    <thead>
        <tr>
            <th style="width: 40px">#</th>
            <th>Slugline</th>
            <th style="width: 60px">I/E</th>
            <th style="width: 60px">D/N</th>
            <th style="width: 60px">Pages</th>
            <th>Cast</th>
        </tr>
    </thead>
    <tbody>
        ${day.scenes.map(scene => `
        <tr>
            <td>${scene.order}</td>
            <td>${scene.sluglineTitle}</td>
            <td>${scene.intExt}</td>
            <td>${scene.dayNight}</td>
            <td>1/8</td>
            <td>${scene.characters.join(', ')}</td>
        </tr>
        `).join('')}
    </tbody>
</table>

<div class="section-title">Cast Call</div>
<table>
    <thead>
        <tr>
            <th>Character</th>
            <th>Actor</th>
            <th style="width: 100px">Call Time</th>
            <th>Costume/Makeup</th>
        </tr>
    </thead>
    <tbody>
        ${day.castCalls.map(cast => `
        <tr>
            <td>${cast.characterName}</td>
            <td>${cast.actorName || 'TBD'}</td>
            <td>${cast.callTime}</td>
            <td>${(cast.costume || '') + (cast.makeup ? ' / ' + cast.makeup : '') || 'TBD'}</td>
        </tr>
        `).join('')}
    </tbody>
</table>
`;
    });

    htmlContent += `
</body>
</html>
`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Shooting Schedule PDF (일촬표)
export function generateShootingSchedulePDF(docData: ProductionDocModel) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Shooting Schedule</title>
    <style>
        @media print {
            @page { 
                margin: 1cm;
                size: landscape;
            }
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            font-size: 9pt;
            line-height: 1.3;
        }
        .header {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .day-header {
            background: #e8e8e8;
            padding: 8px;
            font-weight: bold;
            font-size: 11pt;
            margin: 15px 0 8px 0;
        }
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 12px 0 6px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        th {
            background: #2c3e50;
            color: white;
            padding: 6px;
            text-align: left;
            font-weight: bold;
            font-size: 9pt;
        }
        td {
            border-bottom: 1px solid #ddd;
            padding: 4px 6px;
            font-size: 8pt;
        }
        tr:nth-child(even) {
            background: #f5f5f5;
        }
    </style>
</head>
<body>
<div class="header">SHOOTING SCHEDULE - ${docData.project.title}</div>
`;

    docData.days.forEach((day, index) => {
        if (index > 0) htmlContent += '<div class="page-break"></div>';

        htmlContent += `
<div class="day-header">Day ${day.dayNumber} [${day.date}] | Call: ${day.shootDay.callTime} | Loc: ${day.shootDay.mainLocation.name}</div>

<table>
    <thead>
        <tr>
            <th style="width: 50px">Order</th>
            <th>Scene / Slugline</th>
            <th style="width: 70px">INT/EXT</th>
            <th style="width: 80px">DAY/NIGHT</th>
            <th style="width: 200px">Cast</th>
            <th>Synopsis/Notes</th>
        </tr>
    </thead>
    <tbody>
        ${day.scenes.map(scene => `
        <tr>
            <td>${scene.order}</td>
            <td>${scene.sceneNumber}. ${scene.sluglineTitle}</td>
            <td>${scene.intExt}</td>
            <td>${scene.dayNight}</td>
            <td>${scene.characters.join(', ')}</td>
            <td>${scene.synopsis || '-'}</td>
        </tr>
        `).join('')}
    </tbody>
</table>

<div class="section-title">Detailed Schedule (세부 일정)</div>
<table>
    <thead>
        <tr>
            <th style="width: 60px">Time</th>
            <th>Activity</th>
            <th style="width: 150px">Location</th>
            <th style="width: 70px">Duration</th>
        </tr>
    </thead>
    <tbody>
        ${day.timetable.map(block => `
        <tr>
            <td>${block.time}</td>
            <td>${block.activityLabel}${block.memo ? '<br><small>(' + block.memo + ')</small>' : ''}</td>
            <td>${block.location || ''}</td>
            <td>${block.duration}m</td>
        </tr>
        `).join('')}
    </tbody>
</table>

${day.castCalls.length > 0 ? `
<div class="section-title">CAST CALL TIMES</div>
<table>
    <thead>
        <tr>
            <th>Character</th>
            <th>Actor</th>
            <th style="width: 100px">Call Time</th>
            <th>Costume/Makeup</th>
        </tr>
    </thead>
    <tbody>
        ${day.castCalls.map(cast => `
        <tr>
            <td>${cast.characterName}</td>
            <td>${cast.actorName || 'TBD'}</td>
            <td>${cast.callTime}</td>
            <td>${(cast.costume || "") + (cast.makeup ? " / " + cast.makeup : "") || "TBD"}</td>
        </tr>
        `).join('')}
    </tbody>
</table>
` : ''}
`;
    });

    htmlContent += `
</body>
</html>
`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.print();
    }, 250);
}
