'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileArchive, AlertCircle, CheckCircle, Loader2, FileText, Play } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Same formats as single claim page
const REPORT_FORMATS = [
    'UIIC', 'NIA', 'OIC', 'NIC', 'Other Insurer', 'SBI', 'Volo TPA',
    'UIIC Low Cost', 'NIA Low Cost', 'OIC Low Cost', 'NIC Low Cost',
    'Other Insurer Low Cost', 'SBI Low Cost'
];

type ProcessStatus = 'pending' | 'searching' | 'generating' | 'completed' | 'error';

interface BulkItem {
    id: string; // unique id for list key
    claimNo: string;
    status: ProcessStatus;
    message?: string;
    data?: any; // To store fetched claim data
    blob?: Blob; // To store generated DOCX
}

export default function BulkPage() {
    const router = useRouter();
    const [input, setInput] = useState('');
    const [items, setItems] = useState<BulkItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState(REPORT_FORMATS[0]);

    const parseInput = () => {
        const claims = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        // Remove duplicates and create items
        const uniqueClaims = Array.from(new Set(claims));
        const newItems: BulkItem[] = uniqueClaims.map(claimNo => ({
            id: Math.random().toString(36).substr(2, 9),
            claimNo,
            status: 'pending'
        }));
        setItems(newItems);
    };

    const processBatch = async () => {
        setIsProcessing(true);

        // We handle items sequentially to show progress, though parallel is possible.
        // Parallel might hit rate limits or boil the server, so sequential or small chunks is safer.
        // Let's do sequential for better UI feedback.

        const newItems = [...items];

        for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].status === 'completed') continue; // Skip already done

            newItems[i] = { ...newItems[i], status: 'searching' };
            setItems([...newItems]);

            try {
                // Step 1: Search
                const searchRes = await fetch(`/api/search-claim?claimNo=${encodeURIComponent(newItems[i].claimNo)}`);
                const searchJson = await searchRes.json();

                if (!searchJson.success) {
                    throw new Error(searchJson.error || 'Claim not found');
                }

                newItems[i] = { ...newItems[i], status: 'generating', data: searchJson.data };
                setItems([...newItems]);

                // Step 2: Generate Report
                const genRes = await fetch('/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        claimNo: newItems[i].claimNo,
                        format: selectedFormat,
                        data: searchJson.data
                    })
                });

                if (!genRes.ok) throw new Error('Generation failed');

                const blob = await genRes.blob();
                newItems[i] = { ...newItems[i], status: 'completed', blob };

            } catch (err: any) {
                newItems[i] = { ...newItems[i], status: 'error', message: err.message };
            }

            setItems([...newItems]);
        }

        setIsProcessing(false);
    };

    const downloadZip = async () => {
        const zip = new JSZip();
        let count = 0;

        items.forEach(item => {
            if (item.status === 'completed' && item.blob) {
                zip.file(`${item.claimNo}_${selectedFormat}.docx`, item.blob);
                count++;
            }
        });

        if (count === 0) {
            alert('No completed reports to download.');
            return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `bulk_reports_${new Date().toISOString().split('T')[0]}.zip`);
    };

    const reset = () => {
        setItems([]);
        setInput('');
        setIsProcessing(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
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
                            <FileArchive className="h-6 w-6 text-blue-400" />
                            Bulk Report Generation
                        </h1>
                        <p className="text-gray-400 text-sm">Generate multiple reports at once</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Area */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-emerald-400" />
                                1. Enter Claims
                            </h2>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={items.length > 0}
                                placeholder="Paste claim numbers here...&#10;CLM001&#10;CLM002&#10;CLM003"
                                className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-blue-400 outline-none resize-none disabled:opacity-50"
                            />
                            {items.length === 0 && (
                                <button
                                    onClick={parseInput}
                                    disabled={!input.trim()}
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    Load Claims
                                </button>
                            )}
                            {items.length > 0 && !isProcessing && (
                                <button
                                    onClick={reset}
                                    className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm transition-colors"
                                >
                                    Clear & Start Over
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Configuration & Status */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Config */}
                        <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-yellow-400" />
                                2. Configuration
                            </h2>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 block mb-2">Report Format</label>
                                    <select
                                        value={selectedFormat}
                                        onChange={(e) => setSelectedFormat(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                    >
                                        {REPORT_FORMATS.map(f => (
                                            <option key={f} value={f} className="bg-slate-800">{f}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={processBatch}
                                        disabled={items.length === 0 || isProcessing || items.every(i => i.status === 'completed')}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center gap-2"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
                                        {isProcessing ? 'Processing...' : 'Start Generation'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="glass-panel p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[300px]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-purple-400" />
                                    3. Status
                                </h2>
                                {items.some(i => i.status === 'completed') && (
                                    <button
                                        onClick={downloadZip}
                                        className="text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-colors"
                                    >
                                        Download ZIP
                                    </button>
                                )}
                            </div>

                            {items.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                                    Load claims to begin...
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                                            <div className="flex items-center gap-3">
                                                {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-500" />}
                                                {item.status === 'searching' && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                                                {item.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />}
                                                {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                                                {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}

                                                <span className="font-mono text-sm">{item.claimNo}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {item.status === 'pending' && 'Waiting...'}
                                                {item.status === 'searching' && 'Searching...'}
                                                {item.status === 'generating' && 'Generating DOCX...'}
                                                {item.status === 'completed' && 'Ready'}
                                                {item.status === 'error' && (
                                                    <span className="text-red-400">{item.message}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
