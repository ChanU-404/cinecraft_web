"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Shot {
    id: string;
    type: string;
    camera: string;
    description: string;
    selectedImageUrl?: string; // Phase 18: Selected story image
}

export interface ScriptBlock {
    type: 'action' | 'dialogue' | 'slugline';
    text: string;
    speaker?: string;
}

export interface Scene {
    id: string;
    location: string;
    time: string;
    summary: string;
    script_blocks: ScriptBlock[];
    shots: Shot[];
    directorIntent?: string;
    selectedThumbnailUrl?: string; // Scene Cover
    globalContext?: string; // Phase 21: Global Context (Characters, Background)
}

export interface Project {
    id: string;
    title: string;
    lastModified: number;
    scenes: Scene[];
}

interface ScreenplayContextType {
    scenes: Scene[];
    setScenes: (scenes: Scene[]) => void;
    scriptText: string;
    setScriptText: (text: string) => void;
    isAnalyzing: boolean;
    setIsAnalyzing: (isAnalyzing: boolean) => void;
    storyboardCache: Record<string, any[]>;
    updateStoryboardCache: (shotId: string, images: any[]) => void;
    updateSceneIntent: (sceneId: string, intent: string) => void;
    updateSceneGlobalContext: (sceneId: string, context: string) => void;
    updateSceneShots: (sceneId: string, newShots: Shot[]) => void;
    selectSceneThumbnail: (sceneId: string, imageUrl: string) => void;
    selectShotImage: (sceneId: string, shotId: string, imageUrl: string) => void;

    // Project Management
    projects: Project[];
    currentProjectId: string | null;
    createNewProject: () => void;
    loadProject: (projectId: string) => void;
    saveCurrentProject: (title?: string, specificScenes?: Scene[]) => Promise<void>;
    renameProject: (projectId: string, newTitle: string) => Promise<void>;
    deleteProjectHandler: (projectId: string) => Promise<void>;
    isSaving: boolean;
}

const ScreenplayContext = createContext<ScreenplayContextType | undefined>(undefined);

export function ScreenplayProvider({ children }: { children: ReactNode }) {
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [scriptText, setScriptText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [storyboardCache, setStoryboardCache] = useState<Record<string, any[]>>({});

    // Project State
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load projects on mount
    React.useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            if (Array.isArray(data)) setProjects(data);
        } catch (e) {
            console.error("Failed to load projects", e);
        }
    };

    const updateStoryboardCache = (shotId: string, images: any[]) => {
        setStoryboardCache(prev => ({
            ...prev,
            [shotId]: images
        }));
    };

    const updateSceneIntent = (sceneId: string, intent: string) => {
        setScenes(prev => {
            const newScenes = prev.map(scene =>
                scene.id === sceneId ? { ...scene, directorIntent: intent } : scene
            );
            saveCurrentProject(undefined, newScenes);
            return newScenes;
        });
    };

    const updateSceneGlobalContext = (sceneId: string, context: string) => {
        setScenes(prev => {
            const newScenes = prev.map(scene =>
                scene.id === sceneId ? { ...scene, globalContext: context } : scene
            );
            saveCurrentProject(undefined, newScenes);
            return newScenes;
        });
    };

    const updateSceneShots = (sceneId: string, newShots: Shot[]) => {
        setScenes(prev => {
            const newScenes = prev.map(scene =>
                scene.id === sceneId ? { ...scene, shots: newShots } : scene
            );
            saveCurrentProject(undefined, newScenes);
            return newScenes;
        });
    };

    const selectSceneThumbnail = (sceneId: string, imageUrl: string) => {
        setScenes(prev => {
            const newScenes = prev.map(scene =>
                scene.id === sceneId ? { ...scene, selectedThumbnailUrl: imageUrl } : scene
            );
            saveCurrentProject(undefined, newScenes);
            return newScenes;
        });
    };

    const selectShotImage = (sceneId: string, shotId: string, imageUrl: string) => {
        setScenes(prev => {
            const newScenes = prev.map(scene => {
                if (scene.id !== sceneId) return scene;

                const newShots = scene.shots.map(shot =>
                    shot.id === shotId ? { ...shot, selectedImageUrl: imageUrl } : shot
                );
                return { ...scene, shots: newShots };
            });
            saveCurrentProject(undefined, newScenes);
            return newScenes;
        });
    };

    // --- Project Actions ---

    const createNewProject = () => {
        const newId = crypto.randomUUID();
        setCurrentProjectId(newId);
        setScenes([]);
        setScriptText("");
        setStoryboardCache({});
        setIsAnalyzing(false);
    };

    const saveCurrentProject = async (title?: string, specificScenes?: Scene[]) => {
        if (!currentProjectId) {
            console.error("No current project ID");
            return;
        }

        const idToSave = currentProjectId;
        const scenesToSave = specificScenes || scenes;

        // Find existing to preserve title if title arg isn't passed or is default
        const existing = projects.find(p => p.id === idToSave);
        const finalTitle = (existing && (!title || title === "Untitled Project")) ? existing.title : (title || "Untitled Project");

        const projectData: Project = {
            id: idToSave,
            title: finalTitle,
            lastModified: Date.now(),
            scenes: scenesToSave
        };

        // Optimistic UI Update
        setProjects(prev => {
            const idx = prev.findIndex(p => p.id === idToSave);
            if (idx >= 0) {
                const newStats = [...prev];
                newStats[idx] = projectData;
                return newStats;
            }
            return [projectData, ...prev];
        });

        try {
            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
        } catch (e) {
            console.error("Failed to save project", e);
        }
    };

    const renameProject = async (projectId: string, newTitle: string) => {
        if (!newTitle.trim()) return;

        setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, title: newTitle, lastModified: Date.now() } : p
        ));

        // Sync with backend (we essentially just re-save the meta of that project)
        // Since our backend is simple file storage, we need to be careful not to overwrite scenes with empty if we just send meta.
        // But our `saveProject` on backend overwrites everything. 
        // So we need to find the full project state to save it back.
        const project = projects.find(p => p.id === projectId);
        if (project) {
            const updatedProject = { ...project, title: newTitle, lastModified: Date.now() };
            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProject)
            });
        }
    };

    const loadProject = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setCurrentProjectId(project.id);
            setScenes(project.scenes || []);
            setStoryboardCache({});
        }
    };

    const deleteProjectHandler = async (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (currentProjectId === projectId) {
            createNewProject();
        }
        await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' });
    };

    return (
        <ScreenplayContext.Provider
            value={{
                scenes,
                setScenes,
                scriptText,
                setScriptText,
                isAnalyzing,
                setIsAnalyzing,
                storyboardCache,
                updateStoryboardCache,
                updateSceneIntent,
                updateSceneGlobalContext,
                updateSceneShots,
                selectSceneThumbnail,
                selectShotImage,
                projects,
                currentProjectId,
                createNewProject,
                loadProject,
                saveCurrentProject,
                renameProject,
                deleteProjectHandler,
                isSaving
            }}
        >
            {children}
        </ScreenplayContext.Provider>
    );
}

export function useScreenplay() {
    const context = useContext(ScreenplayContext);
    if (context === undefined) {
        throw new Error('useScreenplay must be used within a ScreenplayProvider');
    }
    return context;
}
