'use client';

import React, { useState } from 'react';
import { updateUserPlan } from '@/app/admin/experiments/actions';
import { RefreshCw, Search, Shield, Users, List, Activity } from 'lucide-react';

interface Props {
    users: any[];
    waitlist: any[];
    events: any[];
}

export default function AdminDashboard({ users, waitlist, events }: Props) {
    const [activeTab, setActiveTab] = useState<'users' | 'waitlist' | 'events'>('users');
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePlanChange = async (email: string, newPlan: string) => {
        setLoadingEmail(email);
        try {
            await updateUserPlan(email, newPlan);
        } catch (e) {
            alert("Failed to update plan");
            console.error(e);
        } finally {
            setLoadingEmail(null);
        }
    };

    return (
        <div className="bg-[#0b0f17] min-h-screen text-white p-8 font-sans">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#ff365c] uppercase tracking-tighter flex items-center gap-2">
                        <Shield className="w-6 h-6" /> CineCraft Admin
                    </h1>
                    <p className="text-[#94a3b8] text-sm">Experiment Control Center</p>
                </div>

                <div className="flex bg-[#1f2937] p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-[#ff365c] text-white' : 'text-[#94a3b8] hover:text-white'}`}
                    >
                        <Users className="w-4 h-4 inline mr-2" /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('waitlist')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'waitlist' ? 'bg-[#ff365c] text-white' : 'text-[#94a3b8] hover:text-white'}`}
                    >
                        <List className="w-4 h-4 inline mr-2" /> Waitlist
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'events' ? 'bg-[#ff365c] text-white' : 'text-[#94a3b8] hover:text-white'}`}
                    >
                        <Activity className="w-4 h-4 inline mr-2" /> Events
                    </button>
                </div>
            </header>

            {activeTab === 'users' && (
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-[#1f2937] flex items-center gap-4">
                        <Search className="w-4 h-4 text-[#94a3b8]" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-sm w-full"
                        />
                    </div>

                    <table className="w-full text-left text-sm text-[#cbd5f5]">
                        <thead className="bg-[#020617] text-[#94a3b8] font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Plan</th>
                                <th className="p-4">Joined</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2937]">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-[#1f2937]/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{user.name}</div>
                                        <div className="text-xs text-[#64748b]">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`
                                    px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest
                                    ${user.plan === 'PRO' ? 'bg-[#ff365c] text-white' :
                                                user.plan === 'MEMBER' ? 'bg-emerald-500 text-white' : 'bg-[#334155] text-[#94a3b8]'}
                                `}>
                                            {user.plan}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-[#64748b]">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {loadingEmail === user.email ? (
                                            <RefreshCw className="w-4 h-4 animate-spin inline text-[#ff365c]" />
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handlePlanChange(user.email, 'MEMBER')}
                                                    disabled={user.plan === 'MEMBER'}
                                                    className="px-2 py-1 border border-[#334155] rounded text-[10px] hover:bg-white hover:text-black transition-colors disabled:opacity-30"
                                                >
                                                    SET MEMBER
                                                </button>
                                                <button
                                                    onClick={() => handlePlanChange(user.email, 'PRO')}
                                                    disabled={user.plan === 'PRO'}
                                                    className="px-2 py-1 border border-[#ff365c] text-[#ff365c] rounded text-[10px] hover:bg-[#ff365c] hover:text-white transition-colors disabled:opacity-30"
                                                >
                                                    SET PRO
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'waitlist' && (
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-[#cbd5f5]">
                        <thead className="bg-[#020617] text-[#94a3b8] font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Willingness</th>
                                <th className="p-4">Use Case</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2937]">
                            {waitlist.map(w => (
                                <tr key={w.id} className="hover:bg-[#1f2937]/50 transition-colors">
                                    <td className="p-4 font-bold">{w.email}</td>
                                    <td className="p-4 text-xs">{w.roleCategory}</td>
                                    <td className="p-4">
                                        <div className="w-24 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#ff365c]" style={{ width: `${w.willingness * 20}%` }} />
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs max-w-xs truncate" title={w.useCaseText}>{w.useCaseText}</td>
                                    <td className="p-4 text-xs text-[#64748b]">{new Date(w.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {waitlist.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-[#64748b]">No waitlist entries yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-[#cbd5f5]">
                        <thead className="bg-[#020617] text-[#94a3b8] font-bold uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Event</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f2937]">
                            {events.map(e => (
                                <tr key={e.id} className="hover:bg-[#1f2937]/50 transition-colors">
                                    <td className="p-4 font-bold text-[#ff365c]">{e.eventName}</td>
                                    <td className="p-4 text-xs">{e.userId || e.anonId || '-'}</td>
                                    <td className="p-4 text-xs font-mono text-[#64748b]">{e.properties}</td>
                                    <td className="p-4 text-xs text-[#64748b]">{new Date(e.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                            {events.length === 0 && (
                                <tr><td colSpan={4} className="p-8 text-center text-[#64748b]">No events logged yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}
