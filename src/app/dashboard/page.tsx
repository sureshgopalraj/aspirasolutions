'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, TrendingUp, Users, DollarSign, Activity, Loader2 } from 'lucide-react';

interface AnalyticsData {
    totalClaims: number;
    totalAmount: number;
    claimsByInsurer: { name: string; count: number }[];
    recentClaims: any[];
    processedCount: number;
    pendingCount: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics');
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                Failed to load data
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 text-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-pink-400" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm">Overview of your claims performance</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Claims"
                        value={data.totalClaims.toString()}
                        icon={<Users className="h-5 w-5 text-blue-400" />}
                        subtext={`${data.pendingCount} Pending`}
                    />
                    <StatCard
                        title="Total Value"
                        value={formatCurrency(data.totalAmount)}
                        icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
                        subtext="Estimated Claim Value"
                    />
                    <StatCard
                        title="Processed"
                        value={data.processedCount.toString()}
                        icon={<Activity className="h-5 w-5 text-purple-400" />}
                        subtext={`${((data.processedCount / data.totalClaims) * 100).toFixed(1)}% Rate`}
                    />
                    <StatCard
                        title="Top Insurer"
                        value={data.claimsByInsurer[0]?.name || 'N/A'}
                        icon={<TrendingUp className="h-5 w-5 text-yellow-400" />}
                        subtext={`${data.claimsByInsurer[0]?.count || 0} Claims`}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Charts / Distribution */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h2 className="text-lg font-semibold mb-6">Claims by Insurance Company</h2>
                        <div className="space-y-4">
                            {data.claimsByInsurer.map((item, idx) => (
                                <div key={item.name} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-200">{item.name}</span>
                                        <span className="text-gray-400">{item.count} claims</span>
                                    </div>
                                    <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'][idx % 5]
                                                }`}
                                            style={{ width: `${(item.count / data.totalClaims) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Claims List */}
                    <div className="lg:col-span-1 glass-panel p-6 rounded-2xl bg-white/5 border border-white/10">
                        <h2 className="text-lg font-semibold mb-6">Recently Added</h2>
                        <div className="space-y-4">
                            {data.recentClaims.map((claim, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => router.push(`/claim/${encodeURIComponent(claim.claimNo)}`)}>
                                    <div>
                                        <div className="font-medium text-blue-200">{claim.claimNo}</div>
                                        <div className="text-xs text-gray-400">{claim.patientName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-emerald-400">
                                            {formatCurrency(parseFloat(claim.claimAmount?.replace(/,/g, '') || '0'))}
                                        </div>
                                        <div className="text-xs text-gray-500">{claim.insuranceCompany}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext: string }) {
    return (
        <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                    <div className="text-2xl font-bold mt-1 text-white">{value}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-white transition-colors">
                    {icon}
                </div>
            </div>
            <p className="text-xs text-gray-500 bg-black/20 inline-block px-2 py-1 rounded">
                {subtext}
            </p>
        </div>
    );
}
