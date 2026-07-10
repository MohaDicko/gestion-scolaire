'use client';

import React from 'react';

export interface CertificateData {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  classroom: string;
  academicYear: string;
  schoolName: string;
  schoolLogo: string | null;
  schoolAddress?: string;
  schoolCity?: string;
  schoolPhone?: string;
}

interface CertificateTemplateProps {
  student: CertificateData;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ student }) => {
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-lg border border-slate-200 relative print:shadow-none print:border-none print:m-0 print:p-[20mm]">
      {/* En-tête */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-12">
        <div className="flex items-center gap-4">
          {student.schoolLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.schoolLogo} alt="Logo" className="w-24 h-24 object-contain" />
          ) : (
            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-300">
              LOGO
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
              {student.schoolName}
            </h1>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {student.schoolAddress || 'Adresse de l\'établissement'}
            </p>
            <p className="text-sm text-slate-600 font-medium">
              {student.schoolCity || 'Ville, Pays'}
            </p>
            <p className="text-sm text-slate-600 font-medium">
              Tél: {student.schoolPhone || '+000 00 00 00 00'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500">Année Scolaire</p>
          <p className="text-lg font-black text-slate-800">{student.academicYear}</p>
        </div>
      </div>

      {/* Titre */}
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black uppercase tracking-[0.2em] underline decoration-4 underline-offset-8">
          Certificat de Scolarité
        </h2>
      </div>

      {/* Corps du texte */}
      <div className="text-lg leading-loose text-justify text-slate-800 mb-20 font-serif">
        <p>
          Je soussigné(e), Directeur de <strong>{student.schoolName}</strong>, certifie par la présente que l'élève :
        </p>
        
        <div className="bg-slate-50 p-6 my-8 border border-slate-200 rounded-lg">
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="text-sm font-bold text-slate-500 uppercase">Nom et Prénom(s) :</div>
            <div className="col-span-2 font-black text-xl">{student.lastName.toUpperCase()} {student.firstName}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="text-sm font-bold text-slate-500 uppercase">Né(e) le :</div>
            <div className="col-span-2 font-bold text-lg">{student.dateOfBirth}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-bold text-slate-500 uppercase">Matricule :</div>
            <div className="col-span-2 font-mono font-bold text-lg">{student.studentNumber}</div>
          </div>
        </div>

        <p>
          est régulièrement inscrit(e) et suit les cours dans notre établissement 
          en classe de <strong>{student.classroom}</strong> pour l'année scolaire en cours.
        </p>
        
        <p className="mt-8">
          En foi de quoi, ce certificat est délivré pour servir et valoir ce que de droit.
        </p>
      </div>

      {/* Bas de page / Signatures */}
      <div className="flex justify-between items-end mt-20">
        <div>
          {/* Un emplacement pour QR Code d'authenticité pourrait aller ici */}
        </div>
        <div className="text-center">
          <p className="text-md mb-8">
            Fait à {student.schoolCity || '________'}, le <strong>{currentDate}</strong>
          </p>
          <p className="font-bold text-lg mb-24 uppercase">La Direction</p>
          <div className="w-64 border-t-2 border-dotted border-slate-400 pt-2">
            <p className="text-xs text-slate-400 italic">Signature et Cachet de l'établissement</p>
          </div>
        </div>
      </div>
    </div>
  );
};
