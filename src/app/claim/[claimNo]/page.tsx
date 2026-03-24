'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Building2, User, Calendar, Shield, Loader2, CheckCircle } from 'lucide-react';
import { ClaimDetails } from '@/lib/googleSheets';

const REPORT_FORMATS = [
    'UIIC',
    'NIA',
    'OIC',
    'NIC',
    'Other Insurer',
    'SBI',
    'Volo TPA',
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
    const [formData, setFormData] = useState<ClaimDetails | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFormat, setSelectedFormat] = useState(REPORT_FORMATS[0]);
    const [downloading, setDownloading] = useState(false);
    const [markingProcessed, setMarkingProcessed] = useState(false);

    useEffect(() => {
        if (!claimNo) return;

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/search-claim?claimNo=${encodeURIComponent(claimNo)}`);
                const json = await res.json();

                if (json.success) {
                    setData(json.data);
                    setFormData(json.data);
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

    const handleInputChange = (field: keyof ClaimDetails, value: string) => {
        if (!formData) return;
        setFormData({ ...formData, [field]: value });
    };

    const handleDownload = async () => {
        if (!formData) return;
        setDownloading(true);

        try {
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    claimNo: formData.claimNo,
                    format: selectedFormat,
                    data: formData, // Send EDITED data
                }),
            });

            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${formData.claimNo}_${selectedFormat}.docx`;
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

    if (error || !data || !formData) {
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
                <header className="flex items-center justify-between mb-8 no-print">
                    <div className="flex items-center gap-4">
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
                    </div>

                    <button
                        onClick={() => {
                            if (isEditing) {
                                // Cancel edits (reset)
                                setFormData(data);
                                setIsEditing(false);
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isEditing
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            }`}
                    >
                        {isEditing ? 'Cancel Edits' : 'Edit Details'}
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Print Header - Visible only when printing */}
                        <div className="hidden print-only mb-8 border-b-2 border-black pb-4">
                            <h1 className="text-3xl font-bold text-black mb-2">Claim Summary Report</h1>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <p>Claim No: <span className="font-bold text-black text-lg">{data.claimNo}</span></p>
                                <p>Generated: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl print:p-0 print:mb-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <User className="h-5 w-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Patient Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem
                                    label="Patient Name"
                                    value={formData.patientName}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('patientName', v)}
                                />
                                <DetailItem
                                    label="Insured Name"
                                    value={formData.insuredName}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('insuredName', v)}
                                />
                                <DetailItem
                                    label="Policy No"
                                    value={formData.policyNo}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('policyNo', v)}
                                />
                                <DetailItem
                                    label="TPA Name"
                                    value={formData.tpaName}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('tpaName', v)}
                                />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6 rounded-2xl print:p-0 print:mb-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <Shield className="h-5 w-5 text-emerald-400" />
                                <h2 className="text-lg font-semibold text-white">Insurance Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem
                                    label="Insurance Company"
                                    value={formData.insuranceCompany}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('insuranceCompany', v)}
                                />
                                <DetailItem
                                    label="Claim Type"
                                    value={formData.claimType}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('claimType', v)}
                                />
                                <DetailItem
                                    label="Allocation Date"
                                    value={formData.allocationDate}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('allocationDate', v)}
                                />
                                <DetailItem
                                    label="Claim Amount"
                                    value={formData.claimAmount}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('claimAmount', v)}
                                />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6 rounded-2xl print:p-0">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                <Building2 className="h-5 w-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Hospital Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <DetailItem
                                    label="Hospital Name"
                                    value={formData.hospitalName}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('hospitalName', v)}
                                />
                                <DetailItem
                                    label="HID"
                                    value={formData.hospitalHiddenId}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('hospitalHiddenId', v)}
                                />
                                <DetailItem
                                    label="Location"
                                    value={formData.hospitalLocation}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('hospitalLocation', v)}
                                />
                                <DetailItem
                                    label="State"
                                    value={formData.hospitalState}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('hospitalState', v)}
                                />
                                <DetailItem
                                    label="DOA"
                                    value={formData.doa}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('doa', v)}
                                />
                                <DetailItem
                                    label="DOD"
                                    value={formData.dod}
                                    isEditing={isEditing}
                                    onChange={(v) => handleInputChange('dod', v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="lg:col-span-1 no-print">
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
                                            {isEditing ? 'Generate Edit' : 'Download Report'}
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? 'Generate w/ Edits' : 'Download Report'}
                                            <Download className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group border border-white/10"
                                >
                                    Print / Save to PDF
                                    <FileText className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
                                </button>

                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to mark this claim as PROCESSED in the Google Sheet?')) return;
                                        setMarkingProcessed(true);
                                        try {
                                            const res = await fetch('/api/mark-processed', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ claimNo: data.claimNo })
                                            });
                                            const json = await res.json();
                                            if (json.success) {
                                                alert('Successfully marked as processed!');
                                            } else {
                                                alert('Failed: ' + json.error);
                                            }
                                        } catch (e) {
                                            alert('Error connecting to server');
                                        } finally {
                                            setMarkingProcessed(false);
                                        }
                                    }}
                                    disabled={markingProcessed}
                                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group border border-purple-500/20 disabled:opacity-50"
                                >
                                    {markingProcessed ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Mark as Processed
                                </button>

                                {isEditing && (
                                    <p className="text-xs text-amber-400 text-center bg-amber-500/10 p-2 rounded">
                                        Note: Edits are temporary for this report and will not save to Google Sheets.
                                    </p>
                                )}

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

function DetailItem({
    label,
    value,
    isEditing = false,
    onChange
}: {
    label: string,
    value: string,
    isEditing?: boolean,
    onChange?: (val: string) => void
}) {
    return (
        <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
            {isEditing ? (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                />
            ) : (
                <p className="text-white font-medium break-words">{value || '-'}</p>
            )}
        </div>
    );
}
