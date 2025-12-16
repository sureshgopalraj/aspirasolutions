import { NextRequest, NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { claimNo, format, data } = body;

        if (!claimNo || !format || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Determine template path
        // In a real app, map 'format' to specific files. 
        // For now, we use a default template or try to find one matching the format.
        const templatesDir = path.join(process.cwd(), 'templates');
        let templatePath = path.join(templatesDir, `${format}.docx`);

        if (!fs.existsSync(templatePath)) {
            // Fallback to default
            templatePath = path.join(templatesDir, 'template.docx');
            if (!fs.existsSync(templatePath)) {
                return NextResponse.json({ error: 'Template not found. Please upload a .docx template to the templates folder.' }, { status: 404 });
            }
        }

        // Read the file
        const content = fs.readFileSync(templatePath, 'binary');

        // Load PizZip
        const zip = new PizZip(content);

        // Create doc instance
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Render the document (replace {placeholders} with data)
        // We map keys to match what the user likely has in their template
        doc.render({
            claimno: data.claimNo,
            tpaname: data.tpaName,
            insurancecompany: data.insuranceCompany,
            claimtype: data.claimType,
            patientname: data.patientName,
            policyno: data.policyNo,
            allocationdate: data.allocationDate,
            doa: data.doa,
            dod: data.dod,
            insuredname: data.insuredName,
            hospitalname: data.hospitalName,
            hospitalhid: data.hospitalHiddenId,
            hospitallocation: data.hospitalLocation,
            hospitalstate: data.hospitalState,
            claimamount: data.claimAmount,
            amt: data.claimAmount,
            insured: data.insuredName,
            type: data.claimType,
            date: new Date().toLocaleDateString('en-IN'), // Current Date
            ...data // fallback to original keys
        });

        // Get the zip document and generate it as a nodebuffer
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Return the file
        return new NextResponse(buf as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${claimNo}_${format}.docx"`,
            },
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
