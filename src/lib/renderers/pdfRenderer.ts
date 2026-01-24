import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ProductionDocModel } from '../production/types';

// Register fonts - use type assertion to fix type mismatch
(pdfMake as any).vfs = pdfFonts;

export function generateCallSheetPDF(docData: ProductionDocModel) {
    const docDefinition: any = {
        content: [],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 10
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'white',
                fillColor: '#0f172a'
            }
        },
        pageMargins: [40, 60, 40, 60]
    };

    // Generate content for each day
    docData.days.forEach((day, dayIndex) => {
        if (dayIndex > 0) {
            docDefinition.content.push({ text: '', pageBreak: 'before' });
        }

        // Header
        docDefinition.content.push({
            text: `CALL SHEET - DAY ${day.dayNumber}`,
            style: 'header'
        });

        // Project Info
        docDefinition.content.push({
            columns: [
                {
                    width: '*',
                    stack: [
                        { text: `Project: ${docData.project.title}`, bold: true },
                        { text: `Director: ${docData.project.director || '-'}` },
                        { text: `Producer: ${docData.project.producer || '-'}` }
                    ]
                },
                {
                    width: 'auto',
                    stack: [
                        { text: `Date: ${day.shootDay.date}`, alignment: 'right' },
                        { text: `Call Time: ${day.shootDay.callTime}`, alignment: 'right' },
                        { text: `Location: ${day.shootDay.mainLocation.name}`, alignment: 'right' }
                    ]
                }
            ],
            margin: [0, 0, 0, 10]
        });

        // Announcements
        if (day.announcements) {
            docDefinition.content.push({
                text: `NOTE: ${day.announcements}`,
                background: '#f0f0f0',
                margin: [0, 0, 0, 10],
                color: '#c80000'
            });
        }

        // Schedule Table
        docDefinition.content.push({
            text: 'Schedule',
            style: 'subheader'
        });

        const scheduleTable = {
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto'],
                body: [
                    [
                        { text: 'Time', style: 'tableHeader' },
                        { text: 'Activity', style: 'tableHeader' },
                        { text: 'Location', style: 'tableHeader' },
                        { text: 'Dur', style: 'tableHeader' }
                    ],
                    ...day.timetable.map(block => [
                        block.time,
                        block.activityLabel + (block.memo ? `\n(${block.memo})` : ''),
                        block.location || '',
                        `${block.duration}m`
                    ])
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 15]
        };

        docDefinition.content.push(scheduleTable);

        // Scenes Table
        docDefinition.content.push({
            text: 'Scenes',
            style: 'subheader'
        });

        const scenesTable = {
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', 'auto', '*'],
                body: [
                    [
                        { text: '#', style: 'tableHeader' },
                        { text: 'Slugline', style: 'tableHeader' },
                        { text: 'I/E', style: 'tableHeader' },
                        { text: 'D/N', style: 'tableHeader' },
                        { text: 'Pages', style: 'tableHeader' },
                        { text: 'Cast', style: 'tableHeader' }
                    ],
                    ...day.scenes.map(scene => [
                        scene.order.toString(),
                        scene.sluglineTitle,
                        scene.intExt,
                        scene.dayNight,
                        '1/8',
                        scene.characters.join(', ')
                    ])
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 15]
        };

        docDefinition.content.push(scenesTable);

        // Cast Call Table
        docDefinition.content.push({
            text: 'Cast Call',
            style: 'subheader'
        });

        const castTable = {
            table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', '*'],
                body: [
                    [
                        { text: 'Character', style: 'tableHeader' },
                        { text: 'Actor', style: 'tableHeader' },
                        { text: 'Call Time', style: 'tableHeader' },
                        { text: 'Costume/Makeup', style: 'tableHeader' }
                    ],
                    ...day.castCalls.map(cast => [
                        cast.characterName,
                        cast.actorName || 'TBD',
                        cast.callTime,
                        'TBD'
                    ])
                ]
            },
            layout: 'noBorders'
        };

        docDefinition.content.push(castTable);
    });

    // Generate and download PDF
    const filename = `CallSheet_${docData.project.title.replace(/\s+/g, '_')}_${docData.days[0].date}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}

// Shooting Schedule PDF (일촬표)
export function generateShootingSchedulePDF(docData: ProductionDocModel) {
    const docDefinition: any = {
        content: [],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 9
        },
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            dayHeader: {
                fontSize: 12,
                bold: true,
                margin: [0, 15, 0, 5],
                fillColor: '#e8e8e8'
            },
            tableHeader: {
                bold: true,
                fontSize: 10,
                color: 'white',
                fillColor: '#2c3e50'
            }
        },
        pageMargins: [30, 50, 30, 50],
        pageOrientation: 'landscape'
    };

    // Overall Header
    docDefinition.content.push({
        text: `SHOOTING SCHEDULE - ${docData.project.title}`,
        style: 'header'
    });

    // Generate content for each day
    docData.days.forEach((day, dayIndex) => {
        if (dayIndex > 0) {
            docDefinition.content.push({ text: '', pageBreak: 'before' });
        }

        // Day Header
        docDefinition.content.push({
            table: {
                widths: ['*'],
                body: [[{
                    text: `Day ${day.dayNumber} [${day.date}] | Call: ${day.shootDay.callTime} | Loc: ${day.shootDay.mainLocation.name}`,
                    style: 'dayHeader'
                }]]
            },
            layout: 'noBorders'
        });

        // Scenes Table
        const scenesTable = {
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', '*', '*'],
                body: [
                    [
                        { text: 'Order', style: 'tableHeader' },
                        { text: 'Scene / Slugline', style: 'tableHeader' },
                        { text: 'INT/EXT', style: 'tableHeader' },
                        { text: 'DAY/NIGHT', style: 'tableHeader' },
                        { text: 'Cast', style: 'tableHeader' },
                        { text: 'Synopsis/Notes', style: 'tableHeader' }
                    ],
                    ...day.scenes.map(scene => [
                        scene.order.toString(),
                        `${scene.sceneNumber}. ${scene.sluglineTitle}`,
                        scene.intExt,
                        scene.dayNight,
                        scene.characters.join(', '),
                        scene.synopsis || '-'
                    ])
                ]
            },
            layout: {
                fillColor: (rowIndex: number) => (rowIndex === 0 ? '#2c3e50' : (rowIndex % 2 === 0 ? '#f5f5f5' : null))
            },
            margin: [0, 5, 0, 15]
        };

        docDefinition.content.push(scenesTable);

        // Timetable
        docDefinition.content.push({
            text: 'Detailed Schedule (세부 일정)',
            fontSize: 11,
            bold: true,
            margin: [0, 0, 0, 5]
        });

        const timetableTable = {
            table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto'],
                body: [
                    [
                        { text: 'Time', style: 'tableHeader' },
                        { text: 'Activity', style: 'tableHeader' },
                        { text: 'Location', style: 'tableHeader' },
                        { text: 'Duration', style: 'tableHeader' }
                    ],
                    ...day.timetable.map(block => [
                        block.time,
                        block.activityLabel + (block.memo ? `\n(${block.memo})` : ''),
                        block.location || '',
                        `${block.duration}m`
                    ])
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 15]
        };

        docDefinition.content.push(timetableTable);

        // Cast Call Times
        if (day.castCalls.length > 0) {
            docDefinition.content.push({
                text: 'CAST CALL TIMES',
                fontSize: 11,
                bold: true,
                margin: [0, 0, 0, 5]
            });

            const castTable = {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', 'auto'],
                    body: [
                        [
                            { text: 'Character', style: 'tableHeader' },
                            { text: 'Actor', style: 'tableHeader' },
                            { text: 'Call Time', style: 'tableHeader' }
                        ],
                        ...day.castCalls.map(cast => [
                            cast.characterName,
                            cast.actorName || 'TBD',
                            cast.callTime
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            };

            docDefinition.content.push(castTable);
        }
    });

    // Generate and download PDF
    const filename = `ShootingSchedule_${docData.project.title.replace(/\s+/g, '_')}_${docData.days[0].date}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
}
