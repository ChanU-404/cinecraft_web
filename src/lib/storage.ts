import prisma from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface Project {
    id: string;
    title: string;
    lastModified: number;
    scenes: any[];
    globalContext?: string;
}

export async function getProjects(): Promise<Project[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return [];
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return [];
    }

    const dbProjects = await prisma.project.findMany({
        where: { userId: user.id },
        orderBy: { lastModified: 'desc' }
    });

    return dbProjects.map(p => ({
        id: p.id,
        title: p.title,
        lastModified: p.lastModified.getTime(),
        scenes: p.scenes as any[],
        globalContext: p.globalContext || undefined
    }));
}

export async function saveProject(project: Project): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error('User not found');
    }

    await prisma.project.upsert({
        where: { id: project.id },
        update: {
            title: project.title,
            scenes: project.scenes,
            globalContext: project.globalContext || "",
            lastModified: new Date(project.lastModified)
        },
        create: {
            id: project.id,
            userId: user.id,
            title: project.title,
            scenes: project.scenes,
            globalContext: project.globalContext || "",
            lastModified: new Date(project.lastModified)
        }
    });
}

export async function deleteProject(id: string): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error('Unauthorized');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error('User not found');
    }

    try {
        await prisma.project.delete({
            where: {
                id,
                userId: user.id  // 본인 프로젝트만 삭제 가능
            }
        });
    } catch (e) {
        console.error("Delete failed", e);
    }
}
