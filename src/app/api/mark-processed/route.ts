import { NextRequest, NextResponse } from 'next/server';
import { markClaimAsProcessed } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const { claimNo } = await request.json();

        if (!claimNo) {
            return NextResponse.json({ success: false, error: 'Claim number is required' }, { status: 400 });
        }

        const success = await markClaimAsProcessed(claimNo);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to update Google Sheet' }, { status: 500 });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
