import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPlan, getCredits } from '@/lib/credits';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize user and plan if not exists
    await getUserPlan(email);

    // Get/Create monthly credits
    const credits = await getCredits(email);
    return NextResponse.json(credits);
}
