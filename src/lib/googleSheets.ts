import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface ClaimDetails {
  tpaName: string;
  claimNo: string;
  insuranceCompany: string;
  claimType: string;
  allocationDate: string;
  patientName: string;
  policyNo: string;
  doa: string;
  dod: string;
  insuredName: string;
  hospitalHiddenId: string; // "Hospital HID"
  hospitalName: string;
  hospitalLocation: string;
  hospitalState: string;
  claimAmount: string;
}

const MOCK_DATA: ClaimDetails[] = [
  {
    tpaName: "MediAssist",
    claimNo: "CLM123456",
    insuranceCompany: "UIIC",
    claimType: "Cashless",
    allocationDate: "2023-10-01",
    patientName: "John Doe",
    policyNo: "POL987654321",
    doa: "2023-09-28",
    dod: "2023-10-02",
    insuredName: "Jane Doe",
    hospitalHiddenId: "HID001",
    hospitalName: "City Hospital",
    hospitalLocation: "Bangalore",
    hospitalState: "Karnataka",
    claimAmount: "50000",
  },
  {
    tpaName: "Vidal Health",
    claimNo: "CLM789012",
    insuranceCompany: "NIA",
    claimType: "Reimbursement",
    allocationDate: "2023-11-15",
    patientName: "Alice Smith",
    policyNo: "POL123456789",
    doa: "2023-11-10",
    dod: "2023-11-14",
    insuredName: "Alice Smith",
    hospitalHiddenId: "HID002",
    hospitalName: "General Hospital",
    hospitalLocation: "Mumbai",
    hospitalState: "Maharashtra",
    claimAmount: "75000",
  },
];

export async function getClaimDetails(claimNo: string): Promise<ClaimDetails | null> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // Use Mock Data if credentials are missing or placeholders
  if (
    !serviceAccountEmail ||
    !privateKey ||
    !sheetId ||
    serviceAccountEmail.includes('mock')
  ) {
    console.warn("Using MOCK DATA for Google Sheets");
    const found = MOCK_DATA.find((c) => c.claimNo === claimNo);
    return found || null;
  }

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();

    // Assuming data is in the first sheet
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Finding the row with the matching Claim No.
    // Mapping based on "Claimno" header found in verification
    const row = rows.find((r) => r.get('Claimno') === claimNo || r.get('Claim No.') === claimNo);

    if (!row) return null;

    return {
      tpaName: row.get('TPA Name') || '',
      claimNo: row.get('Claimno') || row.get('Claim No.') || '',
      insuranceCompany: row.get('Name of Insurance Company') || '',
      claimType: row.get('Type') || row.get('Claim Type') || '',
      allocationDate: row.get('allocation date') || row.get('Allocation Date') || '', // Not found in recent check, keeping logic
      patientName: row.get('Name') || row.get('Patient Name') || '',
      policyNo: row.get('Policy') || row.get('Policy No') || '',
      doa: row.get('DOA') || '',
      dod: row.get('DOD') || '',
      insuredName: row.get('Insured') || row.get('Insured Name') || '',
      hospitalHiddenId: row.get('Hospital HID') || '', // Not found in recent check
      hospitalName: row.get('Hospital Name') || '',
      hospitalLocation: row.get('Hospital Location') || row.get('Hospital Address') || '',
      hospitalState: row.get('Hospital State') || '',
      claimAmount: row.get('Amt') || '',
    };

  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw new Error("Failed to fetch claim details");
  }
}

export async function markClaimAsProcessed(claimNo: string): Promise<boolean> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (
    !serviceAccountEmail ||
    !privateKey ||
    !sheetId ||
    serviceAccountEmail.includes('mock')
  ) {
    console.warn("Using MOCK DATA for Write-back");
    console.log(`Mock: Marked claim ${claimNo} as processed.`);
    return true;
  }

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const row = rows.find((r) => r.get('Claimno') === claimNo || r.get('Claim No.') === claimNo);

    if (!row) {
      console.error(`Claim ${claimNo} not found for write-back`);
      return false;
    }

    // Try to set 'Status' and 'Processed Date'. 
    // Note: These columns must exist in the sheet for this to work without error in some versions,
    // or it might just ignore them. Ideally, user should ensure these headers exist.
    try {
      row.assign({
        'Status': 'Processed',
        'Processed Date': new Date().toLocaleDateString('en-IN')
      });
      await row.save();
    } catch (saveError) {
      console.warn("Could not save to specific columns. Checking if columns exist.", saveError);
      // Fallback or specific error handling if columns don't exist could go here.
      // For now, we assume success implies headers might need creation if they fail.
      throw saveError;
    }

    return true;

  } catch (error) {
    console.error("Error marking claim as processed:", error);
    return false;
  }
}

export interface AnalyticsData {
  totalClaims: number;
  totalAmount: number;
  claimsByInsurer: { name: string; count: number }[];
  recentClaims: ClaimDetails[];
  processedCount: number;
  pendingCount: number;
}

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (
    !serviceAccountEmail ||
    !privateKey ||
    !sheetId ||
    serviceAccountEmail.includes('mock')
  ) {
    // Mock Analytics
    return {
      totalClaims: 150,
      totalAmount: 7500000,
      claimsByInsurer: [
        { name: 'UIIC', count: 45 },
        { name: 'NIA', count: 30 },
        { name: 'OIC', count: 25 },
        { name: 'NIC', count: 20 },
        { name: 'Star Health', count: 30 }
      ],
      recentClaims: MOCK_DATA,
      processedCount: 120,
      pendingCount: 30
    };
  }

  try {
    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    let totalAmount = 0;
    const insurerCounts: Record<string, number> = {};
    let processedCount = 0;
    const recentClaims: ClaimDetails[] = [];

    // Process rows (newest first usually, but check row order)
    // rows are usually top to bottom.
    // We'll take the last 5 rows as "recent" if we assume append order.

    // We iterate nicely
    rows.forEach(row => {
      const amt = parseFloat((row.get('Amt') || '0').replace(/[^0-9.-]+/g, ''));
      if (!isNaN(amt)) totalAmount += amt;

      const insurer = row.get('Name of Insurance Company') || 'Unknown';
      insurerCounts[insurer] = (insurerCounts[insurer] || 0) + 1;

      const status = row.get('Status');
      if (status && status.toLowerCase().includes('processed')) {
        processedCount++;
      }
    });

    // Get recent 5 (from bottom)
    const recentRows = rows.slice(-5).reverse();
    recentRows.forEach(row => {
      recentClaims.push({
        tpaName: row.get('TPA Name') || '',
        claimNo: row.get('Claimno') || row.get('Claim No.') || '',
        insuranceCompany: row.get('Name of Insurance Company') || '',
        claimType: row.get('Type') || row.get('Claim Type') || '',
        allocationDate: row.get('allocation date') || row.get('Allocation Date') || '',
        patientName: row.get('Name') || row.get('Patient Name') || '',
        policyNo: row.get('Policy') || row.get('Policy No') || '',
        doa: row.get('DOA') || '',
        dod: row.get('DOD') || '',
        insuredName: row.get('Insured') || row.get('Insured Name') || '',
        hospitalHiddenId: row.get('Hospital HID') || '',
        hospitalName: row.get('Hospital Name') || '',
        hospitalLocation: row.get('Hospital Location') || '',
        hospitalState: row.get('Hospital State') || '',
        claimAmount: row.get('Amt') || '',
      });
    });

    return {
      totalClaims: rows.length,
      totalAmount,
      claimsByInsurer: Object.entries(insurerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5), // Top 5
      recentClaims,
      processedCount,
      pendingCount: rows.length - processedCount
    };

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}
