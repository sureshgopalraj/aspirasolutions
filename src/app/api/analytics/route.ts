import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic'; // Ensure not cached statically

export async function GET() {
    try {
        const data = await getAnalyticsData();
        if (data) {
            return NextResponse.json({ success: true, data });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
