'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
    const [claimNo, setClaimNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!claimNo.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/search-claim?claimNo=${encodeURIComponent(claimNo)}`);
            const data = await res.json();

            if (data.success) {
                router.push(`/claim/${encodeURIComponent(claimNo)}`);
            } else {
                setError(data.error || 'Claim not valid');
                // Shake animation could be added here via class manipulation if desired
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while searching. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

            <div className="z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                        Claim<span className="text-blue-400">Search</span>
                    </h1>
                    <p className="text-gray-400">Locate and manage your insurance claims instantly.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-8 rounded-2xl">
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="claimNo" className="text-sm font-medium text-gray-300 ml-1">
                                Claim Number
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="claimNo"
                                    type="text"
                                    value={claimNo}
                                    onChange={(e) => setClaimNo(e.target.value)}
                                    placeholder="Enter Claim No. (e.g., CLM123456)"
                                    className="w-full bg-white/5 border border-white/10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-sm transition-all duration-300 pl-10 pr-4 py-3 rounded-xl text-white placeholder:text-gray-500 outline-none"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !claimNo}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    Search Claim
                                    <Search className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="mt-6 bg-red-500/10 border border-red-500/20 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-200 text-sm font-medium">{error}</p>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-6 text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} Claim Management System
            </footer>
        </main>
    );
}
