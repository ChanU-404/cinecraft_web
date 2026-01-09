"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define Scene types (mirroring what we use in page.tsx/data)
export interface Shot {
    id: string;
    type: string;
    camera: string;
    description: string;
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
}

const ScreenplayContext = createContext<ScreenplayContextType | undefined>(undefined);

export function ScreenplayProvider({ children }: { children: ReactNode }) {
    const [scenes, setScenes] = useState<Scene[]>([]); // Start empty, rely on upload
    const [scriptText, setScriptText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [storyboardCache, setStoryboardCache] = useState<Record<string, any[]>>({});

    const updateStoryboardCache = (shotId: string, images: any[]) => {
        setStoryboardCache(prev => ({
            ...prev,
            [shotId]: images
        }));
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
                updateStoryboardCache
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
