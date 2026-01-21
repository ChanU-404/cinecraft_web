import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/");

    // In a real app, verify admin email here.
    // if (!session.user?.email?.endsWith('@cinecraft.ai')) { ... }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    const waitlist = await prisma.waitlist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    const events = await prisma.experimentEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    return <AdminDashboard users={users} waitlist={waitlist} events={events} />;
}
