'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Building2, User, Calendar, Shield, Loader2 } from 'lucide-react';
import { ClaimDetails } from '@/lib/googleSheets';

const REPORT_FORMATS = [
    'UIIC',
    'NIA',
    'OIC',
    'NIC',
    'Other Insurer',
    'SBI',
    'UIIC Low Cost',
    'NIA Low Cost',
    'OIC Low Cost',
    'NIC Low Cost',
    'Other Insurer Low Cost',
    'SBI Low Cost'
];

export default function ClaimDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const claimNo = params.claimNo as string;

    const [data, setData] = useState<ClaimDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFormat, setSelectedFormat] = useState(REPORT_FORMATS[0]);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!claimNo) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/search-claim?claimNo=${encodeURIComponent(claimNo)}`);
                const json = await res.json();

                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || 'Claim not found');
                }
            } catch (err) {
                setError('Failed to load claim details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [claimNo]);

    const handleDownload = async () => {
        if (!data) return;
        setDownloading(true);

        try {
            // TODO: Implement actual generation endpoint
            // Mocking download for now to show UI interaction
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    claimNo: data.claimNo,
                    format: selectedFormat,
                    data: data, // Send data to avoid re-fetching on server if possible
                }),
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.claimNo}_${selectedFormat}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to generate report. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl text-red-400 font-bold mb-4">Error Loading Claim</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Claim Details</h1>
                        <p className="text-blue-400 text-sm">{data.claimNo}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <User className="h-5 w-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Patient Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem label="Patient Name" value={data.patientName} />
                                <DetailItem label="Insured Name" value={data.insuredName} />
                                <DetailItem label="Policy No" value={data.policyNo} />
                                <DetailItem label="TPA Name" value={data.tpaName} />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <Shield className="h-5 w-5 text-emerald-400" />
                                <h2 className="text-lg font-semibold text-white">Insurance Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem label="Insurance Company" value={data.insuranceCompany} />
                                <DetailItem label="Claim Type" value={data.claimType} />
                                <DetailItem label="Allocation Date" value={data.allocationDate} />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6 rounded-2xl">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <Building2 className="h-5 w-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Hospital Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem label="Hospital Name" value={data.hospitalName} />
                                <DetailItem label="HID" value={data.hospitalHiddenId} />
                                <DetailItem label="Location" value={data.hospitalLocation} />
                                <DetailItem label="State" value={data.hospitalState} />
                                <DetailItem label="DOA" value={data.doa} />
                                <DetailItem label="DOD" value={data.dod} />
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-panel p-6 rounded-2xl sticky top-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <FileText className="h-5 w-5 text-yellow-400" />
                                <h2 className="text-lg font-semibold text-white">Generate Report</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Select Format</label>
                                    <div className="relative">
                                        <select
                                            value={selectedFormat}
                                            onChange={(e) => setSelectedFormat(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 backdrop-blur-sm transition-all duration-300 text-gray-200 bg-slate-800/50 p-3 rounded-lg outline-none appearance-none cursor-pointer"
                                        >
                                            {REPORT_FORMATS.map(f => (
                                                <option key={f} value={f} className="bg-slate-800 text-gray-200">{f}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {downloading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            Download Report
                                            <Download className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    Report will be generated in .docx format
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="text-white font-medium break-words">{value || '-'}</p>
        </div>
    );
}
