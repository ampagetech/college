'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getHtmlLetterDataForAdmin } from '@/lib/actions/admission-actions';
import { getMyAdmissionLetter } from '@/lib/actions/admission-actions';

interface DownloadLetterButtonProps {
  admissionId: string;
  admissionRef?: string;
  className?: string;
  isStudentView?: boolean;
}

export default function DownloadLetterButton({ 
  admissionId, 
  admissionRef, 
  className,
  isStudentView = false 
}: DownloadLetterButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleViewLetter = async () => {
    setLoading(true);
    try {
      let letterData;
      
      if (isStudentView || admissionId === 'me' || admissionId === 'my-letter') {
        // For student viewing their own letter
        letterData = await getMyAdmissionLetter();
        if (!letterData) {
          alert('Your admission letter is not available yet');
          return;
        }
      } else {
        // For admin viewing specific applicant's letter using actual admission ID
        letterData = await getHtmlLetterDataForAdmin(admissionId);
        if (!letterData) {
          alert('Admission letter not found or not available');
          return;
        }
      }

      // Debug: Log letterData to main window console
      console.log('=== LETTER DATA DEBUG ===');
      console.log('Full letterData:', letterData);
      console.log('Properties:', Object.keys(letterData));
      console.log('logoDataUri:', letterData.logoDataUri);
      console.log('signatureDataUri:', letterData.signatureDataUri);
      console.log('========================');

      // Generate HTML content
      const letterHTML = generateAdmissionLetterHTML(letterData);
      
      // Create blob and open in new tab
      const blob = new Blob([letterHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const letterWindow = window.open(url, '_blank');
      
      if (!letterWindow) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = `admission-letter-${letterData.admissionRef || 'letter'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Error generating admission letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to generate admission letter: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleViewLetter} 
      disabled={loading}
      className={className}
    >
      {loading ? 'Generating...' : 'View Letter'}
    </Button>
  );
}

function ensureDataUri(dataUri: string | null | undefined): string | null {
  if (!dataUri) {
    console.warn('Image data is null or undefined');
    return null;
  }

  // If it's already a data URI, return as is
  if (dataUri.startsWith('data:image/')) {
    return dataUri;
  }

  // If it's a base64 string, try common image MIME types
  if (dataUri.match(/^[A-Za-z0-9+/]+=*$/)) {
    const testUris = [
      `data:image/png;base64,${dataUri}`,
      `data:image/jpeg;base64,${dataUri}`,
      `data:image/jpg;base64,${dataUri}`
    ];
    
    for (const uri of testUris) {
      const img = new Image();
      img.src = uri;
      if (img.width > 0) {
        console.log(`Valid image URI found: ${uri.substring(0, 30)}...`);
        return uri;
      }
    }
    console.warn('Invalid base64 image data:', dataUri.substring(0, 30) + '...');
    return null;
  }

  // If it's a URL, return as is
  if (dataUri.startsWith('http://') || dataUri.startsWith('https://')) {
    console.log('Using URL for image:', dataUri);
    return dataUri;
  }

  console.warn('Unrecognized image data format:', dataUri.substring(0, 30) + '...');
  return null;
}

function generateAdmissionLetterHTML(letterData: any): string {
  const logoUri = ensureDataUri(letterData.logoDataUri);
  const signatureUri = ensureDataUri(letterData.signatureDataUri);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admission Letter - ${letterData.admissionRef || 'N/A'}</title>
        <style>
            body {
                font-family: 'Calibri', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            .print-button {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 10px 20px;
                background: #1e40af;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                z-index: 1000;
            }
            .print-button:hover {
                background: #1e3a8a;
            }
            @media print {
                .print-button { display: none; }
                body { padding: 0; margin: 0; }
            }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 15px; display: block; object-fit: contain; border: 1px solid #ddd; }
            .university-name { font-size: 24px; font-weight: bold; color: #1e40af; margin: 0; text-transform: uppercase; }
            .university-motto { font-style: italic; color: #6b7280; margin: 5px 0; font-size: 14px; }
            .office-title { font-size: 12px; color: #374151; margin: 2px 0; }
            .ref-date { display: flex; justify-content: space-between; margin: 20px 0; font-size: 12px; }
            .letter-title { font-size: 18px; font-weight: bold; text-align: center; margin: 30px 0 20px; color: #1e40af; text-decoration: underline; }
            .content { margin: 20px 0; text-align: justify; font-size: 14px; }
            .content p { margin: 12px 0; }
            .fee-section { margin: 25px 0; }
            .fee-section h3 { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
            .fee-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            .fee-table th, .fee-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            .fee-table th { background-color: #f9fafb; font-weight: bold; }
            .fee-table .total-row { background-color: #f3f4f6; font-weight: bold; }
            .fee-table .amount-cell { text-align: right; }
            .bank-details { margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 5px; }
            .bank-details h4 { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
            .bank-info { margin: 8px 0; font-size: 12px; }
            .signature-section { margin-top: 40px; text-align: right; }
            .signature-image { width: 120px; height: 60px; margin: 10px 0; object-fit: contain; border: 1px solid #ddd; }
            .signature-text { font-size: 12px; line-height: 1.4; }
        </style>
        <script>
          window.onload = function() {
            console.log('=== Popup Debug ===');
            console.log('Logo URI:', '${logoUri || 'null'}');
            console.log('Signature URI:', '${signatureUri || 'null'}');
            const logoImg = document.querySelector('.logo');
            if (logoImg) {
              logoImg.onerror = () => console.error('Logo failed to load:', logoImg.src);
              logoImg.onload = () => console.log('Logo loaded successfully:', logoImg.src);
            }
            const sigImg = document.querySelector('.signature-image');
            if (sigImg) {
              sigImg.onerror = () => console.error('Signature failed to load:', sigImg.src);
              sigImg.onload = () => console.log('Signature loaded successfully:', sigImg.src);
            }
          };
        </script>
    </head>
    <body>
        <button class="print-button" onclick="window.print()">Print Letter</button>
        <div class="header">
            ${logoUri ? `<img src="${logoUri}" alt="University Logo" class="logo">` : '<div style="height: 80px; width: 80px; margin: 0 auto 15px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">No Logo</div>'}
            <h1 class="university-name">${letterData.universityName || 'JEWEL UNIVERSITY GOMBE'}</h1>
            <p class="university-motto">${letterData.universityMotto || 'Developing Great Minds for Global Impact'}</p>
            <p class="office-title">${letterData.registrarOfficeTitle || '(Office of the Registrar)'}</p>
            <p class="office-title">${letterData.academicDirectorateTitle || 'DIRECTORATE OF SENATE AND ACADEMIC MATTERS'}</p>
        </div>
        <div class="ref-date">
            <span><strong>Ref:</strong> ${letterData.admissionRef || 'N/A'}</span>
            <span><strong>Date:</strong> ${letterData.admissionDateFormatted || new Date().toLocaleDateString()}</span>
        </div>
        <div class="letter-title">OFFER OF PROVISIONAL ADMISSION</div>
        <div class="content">
            <p><strong>Dear ${letterData.studentFullName || 'Student'},</strong></p>
            <p>I am pleased to inform you that you have been offered provisional admission into the <strong>${letterData.courseName || 'Course'}</strong> degree course in the <strong>${letterData.facultyName || 'Faculty'}</strong> for the <strong>${letterData.academicSessionName || 'Academic Session'}</strong> academic session.</p>
            <p>This provisional admission is subject to the verification and confirmation of the credentials submitted in support of your application.</p>
            <p>The commencement of the <strong>${letterData.academicSessionName || 'Academic Session'}</strong> academic session shall be communicated to you with subsequent registration and orientation thereafter.</p>
            <p>You are to pay a non-refundable acceptance fee of <strong>${letterData.acceptanceFeeAmountFormatted || '₦20,000.00'}</strong> to confirm your admission. In order to register as a student, you are also expected to pay the following fees on or before orientation:</p>
        </div>
        ${generateFeeSections(letterData)}
        <div class="bank-details">
            <h4>Payments are to be made to any of the following bank accounts:</h4>
            <div class="bank-info">
                <strong>Account Name:</strong> ${letterData.bankAccountHolderName || 'Jewel University, Gombe'}<br>
                <strong>Bank:</strong> ${letterData.bank1Name || 'Polaris'}<br>
                <strong>Account Number:</strong> ${letterData.bank1AccountNumber || '1771964925'}
            </div>
            ${letterData.bank2Name ? `
            <div class="bank-info">
                <strong>Account Name:</strong> ${letterData.bankAccountHolderName || 'Jewel University, Gombe'}<br>
                <strong>Bank:</strong> ${letterData.bank2Name}<br>
                <strong>Account Number:</strong> ${letterData.bank2AccountNumber || ''}
            </div>
            ` : ''}
        </div>
        <div class="content">
            <p>This offer will lapse on failure to accept it (by paying the acceptance fee) by <strong>${letterData.acceptanceDeadlineFormatted || 'the specified deadline'}</strong>.</p>
            <p>Congratulations.</p>
        </div>
        <div class="signature-section">
            <p>Sincerely,</p>
            ${signatureUri ? `<img src="${signatureUri}" alt="Registrar Signature" class="signature-image">` : '<div style="height: 60px; width: 120px; margin: 10px 0; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">No Signature</div>'}
            <div class="signature-text">
                <strong>${letterData.registrarName || 'REGISTRAR'}</strong><br>
                REGISTRAR
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateFeeSections(letterData: any): string {
  let feeSections = '';
  
  if (letterData.compulsoryOnceOnRegistrationFees?.length > 0) {
    feeSections += `
      <div class="fee-section">
        <h3>A) COMPULSORY FEES (Once on Registration)</h3>
        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Description</th>
              <th>Amount (NGN)</th>
            </tr>
          </thead>
          <tbody>
            ${letterData.compulsoryOnceOnRegistrationFees.map((fee: any) => `
              <tr>
                <td>${fee.description || fee.name || 'N/A'}</td>
                <td class="amount-cell">${fee.amountFormatted || fee.amount || '₦0.00'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Total Once on Registration</strong></td>
              <td class="amount-cell"><strong>${letterData.totalCompulsoryOnceOnRegistration || '₦0.00'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  if (letterData.compulsoryPerSemesterFees?.length > 0) {
    feeSections += `
      <div class="fee-section">
        <h3>B) COMPULSORY FEES (Every Semester)</h3>
        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Description</th>
              <th>Amount (NGN)</th>
            </tr>
          </thead>
          <tbody>
            ${letterData.compulsoryPerSemesterFees.map((fee: any) => `
              <tr>
                <td>${fee.description || fee.name || 'N/A'}</td>
                <td class="amount-cell">${fee.amountFormatted || fee.amount || '₦0.00'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Total Per Semester</strong></td>
              <td class="amount-cell"><strong>${letterData.totalCompulsoryPerSemester || '₦0.00'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
  
  if (letterData.optionalFees?.length > 0) {
    feeSections += `
      <div class="fee-section">
        <h3>C) OPTIONAL FEES</h3>
        <table class="fee-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount (NGN)</th>
            </tr>
          </thead>
          <tbody>
            ${letterData.optionalFees.map((fee: any) => `
              <tr>
                <td>${fee.description || fee.name || 'N/A'}</td>
                <td class="amount-cell">${fee.amountFormatted || fee.amount || '₦0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  return feeSections;
}