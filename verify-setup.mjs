import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Simple .env parser
const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const envVars = env.split('\n').reduce((acc, line) => {
    const firstEqual = line.indexOf('=');
    if (firstEqual > -1) {
        const key = line.substring(0, firstEqual).trim();
        let value = line.substring(firstEqual + 1).trim();
        value = value.replace(/^["']|["']$/g, ''); // Remove quotes
        acc[key] = value;
    }
    return acc;
}, {});

async function testConnection() {
    console.log('Testing connection to Google Sheets...');

    try {
        const email = envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        // Handle escaped newlines in private key
        const key = envVars.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const sheetId = envVars.GOOGLE_SHEET_ID;

        if (!email || !key || !sheetId) {
            throw new Error('Missing credentials in .env.local');
        }

        console.log('DEBUG: Email:', email);
        console.log('DEBUG: Key length:', key.length);
        console.log('DEBUG: Key start:', JSON.stringify(key.substring(0, 40)));
        console.log('DEBUG: Key end:', JSON.stringify(key.substring(key.length - 40)));

        const auth = new JWT({
            email,
            key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(sheetId, auth);
        await doc.loadInfo();
        console.log(`✅ Success! Connected to sheet: "${doc.title}"`);

        // Get headers to verify structure
        const sheet = doc.sheetsByIndex[0];
        await sheet.loadHeaderRow();
        console.log('✅ Headers found:', sheet.headerValues.join(', '));

        const rows = await sheet.getRows({ limit: 1 });
        if (rows.length > 0) {
            console.log(`✅ Found data! First Claim No: ${rows[0].get('Claim No.') || rows[0].get('Claim No')}`);
        } else {
            console.log('⚠️ Connected but sheet is empty.');
        }

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.message.includes('403')) {
            console.error('👉 Hint: Did you share the sheet with the client_email?');
        }
    }
}

testConnection();
