"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type UserTier = 'GUEST' | 'FREE' | 'PRO';

interface Usage {
    draft: number;
    final: number;
}

const QUOTAS = {
    FREE: { draft: 20, final: 1 },
    PRO: { draft: 600, final: 40 },
};

interface SubscriptionContextType {
    tier: UserTier;
    setTier: (tier: UserTier) => void;
    usage: Usage;
    incrementUsage: (type: 'draft' | 'final') => void;
    checkPermission: (action: 'save' | 'export' | 'generate_draft' | 'generate_final') => { allowed: boolean; reason?: string };
    isGuest: boolean;
    quota: Usage;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [tier, setTierState] = useState<UserTier>('GUEST');

    // Simulated Persisted Usage
    const [usage, setUsage] = useState<Usage>({ draft: 0, final: 0 });

    // Sync Tier with Auth Status
    useEffect(() => {
        if (status === 'authenticated') {
            // DEFAULT TO FREE ON LOGIN
            // Real app would fetch this from DB
            setTierState(prev => prev === 'PRO' ? 'PRO' : 'FREE');
        } else {
            setTierState('GUEST');
        }
    }, [status]);

    const setTier = (t: UserTier) => setTierState(t);

    const incrementUsage = (type: 'draft' | 'final') => {
        setUsage(prev => ({ ...prev, [type]: prev[type] + 1 }));
    };

    const getQuota = () => {
        if (tier === 'GUEST') return { draft: 0, final: 0 };
        if (tier === 'FREE') return QUOTAS.FREE;
        return QUOTAS.PRO;
    };

    const checkPermission = (action: 'save' | 'export' | 'generate_draft' | 'generate_final'): { allowed: boolean; reason?: string } => {
        if (tier === 'GUEST') {
            return { allowed: false, reason: "Guest Mode: Feature Locked. Please Sign In." };
        }

        if (tier === 'FREE') {
            if (action === 'save' || action === 'export') {
                return { allowed: false, reason: "Free Tier: Upgrade to Save & Export." };
            }
            if (action === 'generate_draft') {
                if (usage.draft >= QUOTAS.FREE.draft) return { allowed: false, reason: "Draft Quota Exceeded. Upgrade for more." };
            }
            if (action === 'generate_final') {
                if (usage.final >= QUOTAS.FREE.final) return { allowed: false, reason: "Final Render Quota Exceeded. Upgrade for more." };
            }
        }

        return { allowed: true };
    };

    return (
        <SubscriptionContext.Provider value={{
            tier,
            setTier,
            usage,
            incrementUsage,
            checkPermission,
            isGuest: tier === 'GUEST',
            quota: getQuota()
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
