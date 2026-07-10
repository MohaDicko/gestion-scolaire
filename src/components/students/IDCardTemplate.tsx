'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

export interface StudentCardData {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodGroup?: string;
  classroom: string;
  academicYear: string;
  photoUrl: string | null;
  schoolName: string;
  schoolLogo: string | null;
}

interface IDCardTemplateProps {
  student: StudentCardData;
}

export const IDCardTemplate: React.FC<IDCardTemplateProps> = ({ student }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Code containing student verification URL or simple ID
    const generateQR = async () => {
      try {
        const payload = JSON.stringify({
          id: student.studentNumber,
          name: `${student.firstName} ${student.lastName}`,
          valid: student.academicYear
        });
        const url = await QRCode.toDataURL(payload, {
          width: 150,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR Code generation failed', err);
      }
    };
    generateQR();
  }, [student]);

  // ID Card standard dimensions (CR80): 85.6mm x 53.98mm 
  // In pixels (at 300dpi): ~1011px x ~638px
  // We'll use a responsive aspect ratio for the web, fixed for print

  return (
    <div className="flex flex-col gap-4 font-sans print:break-inside-avoid">
      {/* Recto (Front) */}
      <div className="w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative print:shadow-none print:border-slate-300">
        {/* Header background */}
        <div className="absolute top-0 left-0 w-full h-[18mm] bg-blue-600" />
        
        {/* Header Content */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-2">
          {student.schoolLogo ? (
            <div className="w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={student.schoolLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
              LOGO
            </div>
          )}
          <div className="text-right text-white">
            <h1 className="text-[10px] font-black uppercase tracking-wider leading-tight">
              {student.schoolName}
            </h1>
            <p className="text-[8px] opacity-80">CARTE D'IDENTITÉ SCOLAIRE</p>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 mt-6 px-4 flex gap-4">
          {/* Photo */}
          <div className="w-[22mm] h-[28mm] bg-slate-100 rounded-md border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photoUrl} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex flex-col justify-center flex-1">
            <div className="mb-1">
              <p className="text-[7px] text-slate-400 uppercase font-bold">Nom</p>
              <p className="text-[11px] font-black text-slate-800 leading-none">{student.lastName.toUpperCase()}</p>
            </div>
            <div className="mb-1">
              <p className="text-[7px] text-slate-400 uppercase font-bold">Prénom(s)</p>
              <p className="text-[10px] font-bold text-slate-700 leading-none">{student.firstName}</p>
            </div>
            <div className="flex gap-4 mb-1">
              <div>
                <p className="text-[7px] text-slate-400 uppercase font-bold">Classe</p>
                <p className="text-[10px] font-bold text-blue-600 leading-none">{student.classroom}</p>
              </div>
              <div>
                <p className="text-[7px] text-slate-400 uppercase font-bold">Né(e) le</p>
                <p className="text-[9px] font-bold text-slate-700 leading-none">{student.dateOfBirth}</p>
              </div>
            </div>
            <div>
              <p className="text-[7px] text-slate-400 uppercase font-bold">Matricule</p>
              <p className="text-[9px] font-mono font-bold text-slate-800 leading-none">{student.studentNumber}</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full h-[6mm] bg-blue-50 border-t border-blue-100 flex items-center justify-center">
          <p className="text-[7px] font-bold text-blue-800">
            Année Scolaire : {student.academicYear}
          </p>
        </div>
      </div>

      {/* Verso (Back) */}
      <div className="w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-lg border border-slate-200 relative print:shadow-none print:border-slate-300 p-4 flex flex-col justify-between">
        <div className="text-center">
          <p className="text-[8px] text-slate-500 font-medium leading-tight mb-2">
            Cette carte est strictement personnelle. Elle doit être présentée à toute réquisition des autorités de l'établissement. En cas de perte, veuillez prévenir l'administration.
          </p>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col items-center">
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeDataUrl} alt="QR Code" className="w-16 h-16" />
            ) : (
              <div className="w-16 h-16 bg-slate-100" />
            )}
            <p className="text-[6px] text-slate-400 mt-1">Scan pour vérifier</p>
          </div>
          
          <div className="text-center border-t border-slate-400 pt-1 w-24">
            <p className="text-[8px] font-bold text-slate-700">Le Directeur</p>
          </div>
        </div>
      </div>
    </div>
  );
};
