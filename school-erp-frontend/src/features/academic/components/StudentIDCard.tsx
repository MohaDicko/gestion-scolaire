import React from 'react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Printer, Download, MapPin, Phone, Mail, Award } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface StudentIDCardProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    specialtyName: string;
    studentCode: string; // e.g. "2024-IDE-001"
    academicYear: string;
  };
  school: {
    name: string;
    logoUrl?: string;
    address: string;
    phone: string;
  };
}

export function StudentIDCard({ student, school }: StudentIDCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Code containing a link to the student portal or verify URL
    const baseUrl = window.location.origin;
    const verifyUrl = `${baseUrl}/verify/student/${student.id}`;
    
    QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 }, (err, url) => {
      if (!err) setQrCodeUrl(url);
    });
  }, [student.id]);

  const downloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [86, 54] // Standard ID Card size (CR80)
    });

    // We would use html2canvas or direct doc calls here
    // For now, let's trigger a print which is more standard for badges
    window.print();
  };

  return (
    <div className="card-container animate-fade" style={{ maxWidth: '400px', margin: '20px auto' }}>
      <div className="id-card-wrapper glass" id="student-badge">
        {/* Header */}
        <div className="id-card-header">
           <div className="id-card-logo">
             {school.logoUrl ? <img src={school.logoUrl} alt="logo" /> : <div className="logo-placeholder"><Award size={20} /></div>}
           </div>
           <div className="id-card-school-info">
             <div className="id-card-school-name">{school.name}</div>
             <div className="id-card-school-tag">CARTE D'ÉTUDIANT</div>
           </div>
        </div>

        {/* Body */}
        <div className="id-card-body">
          <div className="id-card-photo-section">
            <div className="id-card-photo">
              {student.photoUrl ? <img src={student.photoUrl} alt="student" /> : <div className="photo-placeholder">PHOTO</div>}
            </div>
            <div className="id-card-year">{student.academicYear}</div>
          </div>

          <div className="id-card-info">
            <div className="id-card-name">{student.lastName}</div>
            <div className="id-card-firstname">{student.firstName}</div>
            
            <div className="id-card-specialty">{student.specialtyName}</div>
            
            <div className="id-card-code">MATRICULE: {student.studentCode}</div>
          </div>

          <div className="id-card-qr">
            {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
          </div>
        </div>

        {/* Footer */}
        <div className="id-card-footer">
          <div className="id-footer-item"><MapPin size={8} /> {school.address}</div>
          <div className="id-footer-item"><Phone size={8} /> {school.phone}</div>
        </div>
      </div>

      <div className="id-card-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Imprimer
        </button>
        <button className="btn-ghost" onClick={downloadPDF}>
          <Download size={16} /> Image / PDF
        </button>
      </div>

      <style>{`
        .id-card-wrapper {
          width: 85.6mm;
          height: 54mm;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-2) 0%, var(--bg-3) 100%);
          border: 1px solid var(--border-light);
          padding: 10px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .id-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 6px;
          margin-bottom: 8px;
        }

        .id-card-logo img { width: 30px; height: 30px; border-radius: 6px; }
        .logo-placeholder { 
          width: 30px; height: 30px; background: var(--primary-dim); 
          border-radius: 6px; display: grid; place-items: center; color: var(--primary);
        }

        .id-card-school-name { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text); }
        .id-card-school-tag { font-size: 8px; color: var(--primary); font-weight: 700; letter-spacing: 1px; }

        .id-card-body {
          display: grid;
          grid-template-columns: 70px 1fr 60px;
          gap: 10px;
          flex: 1;
        }

        .id-card-photo {
          width: 70px;
          height: 85px;
          border-radius: 8px;
          background: #333;
          border: 2px solid var(--primary);
          overflow: hidden;
        }
        .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { height: 100%; display: grid; place-items: center; font-size: 8px; color: #666; }
        
        .id-card-year { font-size: 8px; text-align: center; margin-top: 4px; font-weight: 600; }

        .id-card-name { font-size: 14px; font-weight: 800; color: white; margin-top: 5px; }
        .id-card-firstname { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; }
        
        .id-card-specialty { 
          font-size: 9px; background: var(--primary-dim); color: var(--primary); 
          padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: 600;
          margin-bottom: 6px;
        }

        .id-card-code { font-size: 8px; font-family: 'Courier New', monospace; color: var(--text-dim); }

        .id-card-qr img { width: 100%; height: auto; border-radius: 8px; background: white; padding: 2px; }

        .id-card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          font-size: 6px;
          color: var(--text-dim);
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 4px;
        }
        
        .id-footer-item { display: flex; align-items: center; gap: 3px; }

        @media print {
          body * { visibility: hidden; }
          #student-badge, #student-badge * { visibility: visible; }
          #student-badge { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}
