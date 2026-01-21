import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, roleCategory, useCaseText, willingness } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Save to Waitlist
        const entry = await prisma.waitlist.create({
            data: {
                email,
                roleCategory,
                useCaseText,
                willingness: willingness || false,
                sourceAction: 'fake_door_upgrade',
            }
        });

        // Also Log Experiment Event
        await prisma.experimentEvent.create({
            data: {
                eventName: 'waitlist_submitted',
                properties: JSON.stringify({ email, willingness }),
                userState: 'MEMBER' // Simplified
            }
        });

        return NextResponse.json({ success: true, id: entry.id });

    } catch (err: any) {
        console.error("Waitlist error:", err);
        return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }
}
