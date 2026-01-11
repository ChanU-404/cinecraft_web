import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'projects.json');

export interface Project {
    id: string;
    title: string;
    lastModified: number;
    scenes: any[];
}

async function ensureDB() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR);
    }
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, JSON.stringify([]));
    }
}

export async function getProjects(): Promise<Project[]> {
    await ensureDB();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function saveProject(project: Project): Promise<void> {
    await ensureDB();
    const projects = await getProjects();
    const index = projects.findIndex(p => p.id === project.id);

    if (index >= 0) {
        projects[index] = { ...project, lastModified: Date.now() };
    } else {
        projects.push({ ...project, lastModified: Date.now() });
    }

    await fs.writeFile(DB_PATH, JSON.stringify(projects, null, 2));
}

export async function deleteProject(id: string): Promise<void> {
    await ensureDB();
    const projects = await getProjects();
    const filtered = projects.filter(p => p.id !== id);
    await fs.writeFile(DB_PATH, JSON.stringify(filtered, null, 2));
}
