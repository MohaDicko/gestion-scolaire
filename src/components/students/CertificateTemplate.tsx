'use client';

import React from 'react';
import { DIRECTOR_STAMP_URL } from '@/lib/directorStampData';

export interface CertificateData {
  id?: string;
  studentNumber: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  classroom: string;
  academicYear?: string;
  schoolName?: string;
  schoolLogo?: string | null;
  schoolAddress?: string;
  schoolCity?: string;
  schoolPhone?: string;
}

export interface StudentCertificateProps {
  student: CertificateData;
  issueDate?: string;
}

export const CertificateTemplate: React.FC<StudentCertificateProps> = ({
  student,
  issueDate,
}) => {
  const currentDate = issueDate || new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-12 bg-white text-slate-900 shadow-2xl border-8 border-indigo-950 font-serif relative">
      {/* Filigrane discret */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <span className="text-9xl font-bold uppercase tracking-widest text-indigo-900">
          OFFICIEL
        </span>
      </div>

      {/* En-tête de l'établissement */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
        <div className="flex items-center space-x-4">
          {student.schoolLogo ? (
            <img 
              src={student.schoolLogo} 
              alt="Logo École" 
              className="w-20 h-20 object-contain" 
            />
          ) : (
            <div className="w-20 h-20 bg-indigo-900 text-white flex items-center justify-center font-bold text-2xl rounded-full">
              {student.schoolName ? student.schoolName.charAt(0) : 'E'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-wide">
              {student.schoolName || 'Établissement Scolaire'}
            </h2>
            <p className="text-sm text-slate-600 italic">
              République du Mali — Un Peuple - Un But - Une Foi
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-slate-700">CERTIFICAT DE SCOLARITÉ</p>
          <p className="text-xs text-slate-500">Année Scolaire 2025 - 2026</p>
        </div>
      </div>

      {/* Titre du document */}
      <div className="text-center my-12">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase text-indigo-950 underline decoration-2 underline-offset-8">
          ATTESTATION DE SCOLARITÉ
        </h1>
      </div>

      {/* Corps du certificat */}
      <div className="text-lg leading-relaxed space-y-6 text-justify px-8 my-8">
        <p>
          Le Directeur de l'établissement soussigné, atteste par la présente que :
        </p>
        
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-2">
          <p className="text-xl">
            L'élève : <strong className="text-indigo-950 font-bold uppercase">{student.fullName || `${student.firstName || ''} ${student.lastName || ''}`}</strong>
          </p>
          {student.dateOfBirth && (
            <p className="text-md text-slate-700">
              Né(e) le : <strong>{student.dateOfBirth}</strong> {student.placeOfBirth ? `à ${student.placeOfBirth}` : ''}
            </p>
          )}
          <p className="text-md text-slate-700">
            Matricule : <strong className="font-mono text-indigo-900">{student.studentNumber}</strong>
          </p>
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
      <div className="flex justify-between items-end mt-12">
        <div>
          {/* Un emplacement pour QR Code d'authenticité */}
        </div>
        <div className="text-center">
          <p className="text-md mb-4">
            Fait à {student.schoolCity || 'Gao'}, le <strong>{currentDate}</strong>
          </p>
          <p className="font-bold text-lg mb-2 uppercase">La Direction Général</p>
          <div className="flex justify-center my-1">
            <img 
              src={DIRECTOR_STAMP_URL} 
              alt="Cachet et Signature du Directeur Général" 
              className="h-28 object-contain mix-blend-multiply"
            />
          </div>
          <div className="w-64 border-t-2 border-dotted border-slate-400 pt-2">
            <p className="text-xs text-slate-500 italic">Signature et Cachet de l'établissement</p>
          </div>
        </div>
      </div>
    </div>
  );
};
