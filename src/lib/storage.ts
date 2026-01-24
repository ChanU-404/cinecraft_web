import prisma from '@/lib/db';

export interface Project {
    id: string;
    title: string;
    lastModified: number;
    scenes: any[];
    globalContext?: string;
}

export async function getProjects(): Promise<Project[]> {
    const dbProjects = await prisma.project.findMany({
        orderBy: { lastModified: 'desc' }
    });

    return dbProjects.map(p => ({
        id: p.id,
        title: p.title,
        lastModified: p.lastModified.getTime(),
        scenes: p.scenes as any[], // Casting JSON type
        globalContext: p.globalContext || undefined
    }));
}

export async function saveProject(project: Project): Promise<void> {
    await prisma.project.upsert({
        where: { id: project.id },
        update: {
            title: project.title,
            scenes: project.scenes,
            globalContext: project.globalContext || "",
            // lastModified is auto-updated by @updatedAt, but we can force update if we want to sync perfectly
            lastModified: new Date(project.lastModified)
        },
        create: {
            id: project.id,
            title: project.title,
            scenes: project.scenes,
            globalContext: project.globalContext || "",
            lastModified: new Date(project.lastModified)
        }
    });
}

export async function deleteProject(id: string): Promise<void> {
    try {
        await prisma.project.delete({
            where: { id }
        });
    } catch (e) {
        // Handle "Record to delete does not exist" gracefully if needed
        console.error("Delete failed", e);
    }
}

