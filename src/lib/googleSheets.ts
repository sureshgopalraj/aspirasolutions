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
