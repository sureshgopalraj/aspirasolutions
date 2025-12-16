import { NextRequest, NextResponse } from 'next/server';
import { getClaimDetails } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const claimNo = searchParams.get('claimNo');

    if (!claimNo) {
        return NextResponse.json({ error: 'Claim No is required' }, { status: 400 });
    }

    try {
        const data = await getClaimDetails(claimNo);

        if (data) {
            return NextResponse.json({ success: true, data });
        } else {
            return NextResponse.json({ success: false, error: 'Claim not found' }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
