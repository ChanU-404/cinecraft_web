"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export type UserTier = 'GUEST' | 'MEMBER' | 'PRO';

interface Usage {
    draft: number;
    final: number;
}

interface Limits {
    draft: number;
    final: number;
}

const QUOTAS = {
    MEMBER: { draft: 20, final: 1 },
    PRO: { draft: 600, final: 40 },
};

interface SubscriptionContextType {
    tier: UserTier;
    setTier: (tier: UserTier) => void;
    usage: Usage;
    quota: Limits;
    incrementUsage: (type: 'draft' | 'final') => void;
    checkPermission: (action: 'save' | 'export' | 'generate_draft' | 'generate_final') => { allowed: boolean; reason?: string };
    isGuest: boolean;
    refreshCredits: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [tier, setTierState] = useState<UserTier>('GUEST');
    const [usage, setUsage] = useState<Usage>({ draft: 0, final: 0 });
    const [quota, setQuota] = useState<Limits>({ draft: 0, final: 0 });

    const refreshCredits = useCallback(async () => {
        if (status !== 'authenticated' || !session?.user?.email) return;

        try {
            const res = await fetch('/api/credits');
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setUsage({ draft: data.draftUsed, final: data.finalUsed });
                    setQuota({ draft: data.draftLimit, final: data.finalLimit });

                    // Update tier based on database record if available
                    if (data.draftLimit >= 600) setTierState('PRO');
                    else setTierState('MEMBER');
                }
            }
        } catch (e) {
            console.error("Failed to fetch credits", e);
        }
    }, [status, session]);

    // Initial Fetch
    useEffect(() => {
        if (status === 'authenticated') {
            setTierState('MEMBER'); // Default optimistically
            refreshCredits();
        } else {
            setTierState('GUEST');
            setUsage({ draft: 0, final: 0 });
            setQuota({ draft: 0, final: 0 });
        }
    }, [status, refreshCredits]);

    const setTier = (t: UserTier) => {
        setTierState(t);
    };

    const incrementUsage = (type: 'draft' | 'final') => {
        setUsage(prev => ({ ...prev, [type]: prev[type] + 1 }));
        refreshCredits();
    };

    const checkPermission = (action: 'save' | 'export' | 'generate_draft' | 'generate_final'): { allowed: boolean; reason?: string } => {
        if (tier === 'GUEST') {
            return { allowed: false, reason: "Guest Mode: Feature Locked. Please Sign In." };
        }

        if (tier === 'MEMBER') {
            if (action === 'save' || action === 'export') {
                // Keep save allowed for Member based on User Request implying Visitor->Member->Pro funnel
                // But let's stick to "Member = Free" constraints if any. 
                // Assuming Member can save.
            }
            if (action === 'generate_draft') {
                if (usage.draft >= quota.draft) return { allowed: false, reason: "Draft Quota Exceeded. Upgrade for more." };
            }
            if (action === 'generate_final') {
                if (usage.final >= quota.final) return { allowed: false, reason: "Final Render Quota Exceeded. Upgrade for more." };
            }
        }

        return { allowed: true };
    };

    return (
        <SubscriptionContext.Provider value={{
            tier,
            setTier,
            usage,
            quota,
            incrementUsage,
            checkPermission,
            isGuest: tier === 'GUEST',
            refreshCredits
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
