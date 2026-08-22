export interface StudentCardData {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
  classroom?: { name: string };
  campus?: { name: string };
  parentName?: string;
}

export const generateSVGCard = (student: StudentCardData, qrDataUrl: string): string => {
  const year = new Date(student.dateOfBirth).getFullYear();
  const age = new Date().getFullYear() - year;
  const fullName = `${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`;
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 540" width="340" height="540">
      <!-- Background -->
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      
      <rect width="100%" height="100%" rx="24" fill="url(#bg-grad)" />
      
      <!-- Bandeau Supérieur Mali -->
      <rect x="0" y="0" width="113.3" height="8" fill="#009a44" />
      <rect x="113.3" y="0" width="113.3" height="8" fill="#fcd116" />
      <rect x="226.6" y="0" width="113.4" height="8" fill="#ce1126" />

      <!-- Institution Header -->
      <text x="170" y="50" fill="#a5b4fc" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="4" text-anchor="middle">SCHOOLERP PRO</text>
      <text x="170" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="normal" letter-spacing="2" text-anchor="middle">CARTE D'IDENTITÉ SCOLAIRE</text>

      <!-- Photo Border -->
      <circle cx="170" cy="180" r="78" fill="none" stroke="#6366f1" stroke-width="4" opacity="0.5" />
      
      <!-- Photo Placeholder -->
      <circle cx="170" cy="180" r="75" fill="#1e293b" />
      <text x="170" y="195" fill="#475569" font-family="sans-serif" font-size="40" text-anchor="middle">👤</text>

      <text x="170" y="300" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" width="300">${fullName}</text>
      <text x="170" y="325" fill="#818cf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${student.classroom?.name || '—'}</text>

      <!-- Infos -->
      <rect x="30" y="360" width="280" height="1" fill="#334155" />
      
      <text x="40" y="390" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">MATRICULE</text>
      <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${student.studentNumber}</text>

      <text x="40" y="440" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">NÉ(E) LE</text>
      <text x="40" y="460" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</text>

      <!-- QR Code -->
      <rect x="230" y="380" width="70" height="70" rx="8" fill="#ffffff" />
      <image href="${qrDataUrl}" x="235" y="385" width="60" height="60" />

      <!-- Cachet et Signature du Directeur Général -->
      <image href="/stamps/cfppas_stamp_signature.jpg" x="135" y="435" width="90" height="40" opacity="0.9" />
      <text x="180" y="482" fill="#94a3b8" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle">LE DIRECTEUR GÉNÉRAL</text>

      <!-- Footer -->
      <rect x="0" y="500" width="340" height="40" fill="#0f172a" />
      <text x="170" y="525" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1" text-anchor="middle">VALIDE POUR L'ANNÉE 2025-2026</text>
    </svg>
  `;
};
