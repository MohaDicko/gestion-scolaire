"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { FileText, Download, Search, Loader2, Award, CheckCircle2, XCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DIRECTOR_STAMP_BASE64 } from "@/lib/directorStampData";
import { useToast } from "@/components/Toast";

interface ModuleResult {
  numero: number;
  titreModule: string;
  subjectCode: string;
  duree: number | null;
  seuil: number;
  note: number;
  resultat: string;
  reussi: boolean;
}

interface ReleveData {
  school: { name: string; address: string; city: string; email: string; phoneNumber: string; logoUrl?: string };
  student: { id: string; studentNumber: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; campus: string };
  enrollment: { classroom: string; level: string; stream: string; series: string; academicYear: string };
  moduleResults: ModuleResult[];
  summary: { totalModules: number; modulesReussis: number; noteGlobale: number; admis: boolean };
}

export default function ReleveCompetencesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [preview, setPreview] = useState<ReleveData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const toast = useToast();

  // Guard : vérification du type d'école
  const ALLOWED_SCHOOL_TYPES = ['AGRO', 'TECHNIQUE'];
  const [schoolType, setSchoolType] = useState<string | null>(null);
  const [schoolTypeLoading, setSchoolTypeLoading] = useState(true);

  useEffect(() => {
    fetch('/api/school/config')
      .then(r => r.json())
      .then(d => { setSchoolType(d?.type || null); })
      .catch(() => { setSchoolType(null); })
      .finally(() => setSchoolTypeLoading(false));
  }, []);

  const isAuthorizedSchool = schoolType !== null && ALLOWED_SCHOOL_TYPES.includes(schoolType);


  useEffect(() => {
    fetch("/api/academic-years").then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setYears(d);
        const active = d.find((y: any) => y.isActive);
        if (active) setSelectedYearId(active.id);
      }
    });
  }, []);


  useEffect(() => {
    if (!searchTerm.trim()) { setStudents([]); setShowDropdown(false); return; }
    const t = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/students?search=${encodeURIComponent(searchTerm)}&pageSize=10`)
        .then(r => r.json())
        .then(d => { setStudents(d.items || []); setShowDropdown(true); setIsLoading(false); })
        .catch(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelectStudent = async (student: any) => {
    setSelectedStudent(student);
    setSearchTerm(`${student.firstName} ${student.lastName}`);
    setShowDropdown(false);
    if (!selectedYearId) return;
    setLoadingPreview(true);
    setPreview(null);
    try {
      const r = await fetch(`/api/reports/releve-competences?studentId=${student.id}&academicYearId=${selectedYearId}`);
      if (r.ok) setPreview(await r.json());
    } finally { setLoadingPreview(false); }
  };

  const loadPreview = async () => {
    if (!selectedStudent || !selectedYearId) return;
    setLoadingPreview(true);
    setPreview(null);
    try {
      const r = await fetch(`/api/reports/releve-competences?studentId=${selectedStudent.id}&academicYearId=${selectedYearId}`);
      if (r.ok) setPreview(await r.json());
      else toast.error("Impossible de charger les donnees.");
    } finally { setLoadingPreview(false); }
  };

  useEffect(() => {
    if (selectedStudent && selectedYearId) loadPreview();
  }, [selectedYearId]);

  const generatePDF = async () => {
    if (!preview) return;
    setIsGenerating(preview.student.id);
    try {
      const { school, student, enrollment, moduleResults, summary } = preview;
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 14;

      // ── ENCADRE EN-TETE OFFICIEL (style CFPPAS) ───────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(margin, 8, pageW - 2 * margin, 65, "S");

      // Colonne gauche : hiérarchie institutionnelle
      const instLeft = margin + 4;
      let iy = 15;
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
      doc.text("MINISTERE DE L'EDUCATION NATIONALE", instLeft, iy);
      iy += 3.5;
      doc.setLineWidth(0.3); doc.setDrawColor(0);
      doc.line(instLeft, iy, instLeft + 65, iy);
      iy += 4;
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text("DIRECTION NATIONALE DE L'ENSEIGNEMENT", instLeft, iy);
      iy += 3.5;
      doc.text("TECHNIQUE ET PROFESSIONNEL", instLeft, iy);
      iy += 3.5;
      doc.line(instLeft, iy, instLeft + 65, iy);
      iy += 4;
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text("ACADEMIE D'ENSEIGNEMENT DE GAO", instLeft, iy);
      iy += 3.5;
      doc.line(instLeft, iy, instLeft + 65, iy);
      iy += 4;
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
      doc.text("CENTRE DE FORMATION PROFESSIONNELLE", instLeft, iy);
      iy += 3.5;
      doc.text("POUR LA PROMOTION DE L'AGRICULTURE", instLeft, iy);
      iy += 3.5;
      doc.text("AU SAHEL CFP- PAS / GAO", instLeft, iy);
      iy += 3.5;
      doc.line(instLeft, iy, instLeft + 65, iy);
      iy += 4;
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text("BP: 226 - Chateau Secteur III", instLeft, iy);
      iy += 3.5;
      doc.text("Rue 363 - Porte: 54 - GAO", instLeft, iy);
      iy += 3.5;
      doc.text("Tel: 21 82 07 62", instLeft, iy);
      iy += 3.5;
      doc.text("E-mail : cfppasgao98@gmail.com", instLeft, iy);

      // Colonne droite : République du Mali
      const colRight = pageW / 2 + 2;
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
      doc.text("REPUBLIQUE DU MALI", colRight + 22, 15, { align: "center" });
      doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text("UN PEUPLE - UN BUT - UNE FOI", colRight + 22, 20, { align: "center" });

      // Ligne séparatrice verticale au milieu de l'encadré
      doc.setLineWidth(0.3);
      doc.line(pageW / 2, 8, pageW / 2, 73);

      // ── TITRE DU DOCUMENT ──────────────────────────────────────────────
      doc.setLineWidth(0.5);
      doc.rect(margin, 76, pageW - 2 * margin, 10, "S");
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0);
      doc.text("RELEVE DE COMPETENCES  TECHNICIEN EN ENTREPRISE AGRICOLE", pageW / 2, 82.5, { align: "center" });

      // ── INFORMATIONS ELEVE ─────────────────────────────────────────────
      let y = 90;
      doc.setLineWidth(0.4);
      doc.rect(margin, y, pageW - 2 * margin, 18, "S");

      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(`SPECIALITE : ${enrollment.stream || enrollment.level || enrollment.classroom}`, margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text(`Promotion  : ${enrollment.academicYear}`, margin + 4, y + 12);
      doc.setFont("helvetica", "bold");
      doc.text(`Prenoms : ${student.firstName}`, margin + 4, y + 18);
      doc.text(`Nom : ${student.lastName.toUpperCase()}`, margin + 60, y + 18);
      doc.text(`N\u00b0 Mle : ${student.studentNumber}`, margin + 115, y + 18);

      y += 24;

      // ── TABLEAU DES MODULES ────────────────────────────────────────────
      const tableBody = moduleResults.map(m => [
        m.numero.toString(),
        m.titreModule,
        m.duree !== null ? m.duree.toString() : "--",
        m.seuil.toString(),
        m.note % 1 === 0 ? m.note.toString() : m.note.toFixed(1),
        m.resultat === "SUCCES" ? "SUCCES" : "ECHEC",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["N\u00b0", "Titre du module", "Duree\n(H)", "Seuil\n(%)", "Note\n(.../100)", "Resultat"]],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2.2,
          textColor: [0, 0, 0],
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10, fontStyle: "bold" },
          1: { halign: "left", cellWidth: 90 },
          2: { halign: "center", cellWidth: 14 },
          3: { halign: "center", cellWidth: 14 },
          4: { halign: "center", cellWidth: 20, fontStyle: "bold" },
          5: { halign: "center", cellWidth: 24, fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        didParseCell: (data: any) => {
          if (data.column.index === 5 && data.section === "body") {
            const val = data.cell.text[0];
            if (val === "SUCCES") {
              data.cell.styles.textColor = [0, 100, 0];
            } else if (val === "ECHEC") {
              data.cell.styles.textColor = [180, 0, 0];
            }
          }
        },
        margin: { left: margin, right: margin },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || y + 20;

      // ── RÉSULTAT GLOBAL ────────────────────────────────────────────────
      const resumeY = finalY + 6;
      doc.setLineWidth(0.4);
      doc.rect(margin, resumeY, pageW - 2 * margin, 16, "S");

      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(`Modules valides : ${summary.modulesReussis} / ${summary.totalModules}`, margin + 4, resumeY + 6);
      doc.text(`Note globale : ${summary.noteGlobale} / 100`, margin + 4, resumeY + 12);

      const decisionText = summary.admis ? "ADMIS(E) - Tous les modules valides" : `NON ADMIS(E) - ${summary.totalModules - summary.modulesReussis} module(s) non valide(s)`;
      doc.setTextColor(summary.admis ? 0 : 180, summary.admis ? 100 : 0, 0);
      doc.text(`Decision : ${decisionText}`, pageW / 2, resumeY + 9, { align: "center" });
      doc.setTextColor(0, 0, 0);

      // ── SIGNATURES ─────────────────────────────────────────────────────
      const sigY = resumeY + 26;
      const today = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

      doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
      doc.text(`Gao, le ${today}`, pageW - margin - 4, sigY, { align: "right" });

      // Tampon directeur
      try {
        doc.addImage(DIRECTOR_STAMP_BASE64, "JPEG", pageW / 2 - 20, sigY + 2, 44, 20);
      } catch (e) {
        console.warn("Tampon non ajoute", e);
      }

      const sigCols: [string, number][] = [
        ["Le Directeur General", margin + 2],
        ["Le Secretaire", pageW / 2 - 18],
        ["Emargement", pageW - margin - 48],
      ];
      sigCols.forEach(([label, x]) => {
        doc.setDrawColor(0); doc.setLineWidth(0.3);
        doc.line(x, sigY + 24, x + 44, sigY + 24);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(60, 60, 60);
        doc.text(label, x + 22, sigY + 29, { align: "center" });
      });

      // ── PIED DE PAGE ───────────────────────────────────────────────────
      doc.setFontSize(6); doc.setTextColor(130, 130, 130); doc.setFont("helvetica", "normal");
      doc.text(`Document officiel - ${school.name} - ${school.city} - ${new Date().getFullYear()}`, pageW / 2, 291, { align: "center" });

      const filename = `Releve_Competences_${student.lastName}_${student.firstName}_${enrollment.academicYear.replace("/", "-")}.pdf`;
      const base64Data = doc.output('datauristring');
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/reports/download-pdf';
      form.target = '_blank';
      
      const inputBase64 = document.createElement('input');
      inputBase64.type = 'hidden';
      inputBase64.name = 'base64';
      inputBase64.value = base64Data;
      form.appendChild(inputBase64);
      
      const inputFilename = document.createElement('input');
      inputFilename.type = 'hidden';
      inputFilename.name = 'filename';
      inputFilename.value = filename;
      form.appendChild(inputFilename);
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      toast.success("Releve de competences genere !");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la generation.");
    } finally {
      setIsGenerating(null);
    }
  };


  return (
    <AppLayout
      title="Relevé de Compétences"
      subtitle="Document officiel — Formation Professionnelle Agro-Pastorale"
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Relevé de Compétences" }]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── GUARD : vérification du type d'école ── */}
        {schoolTypeLoading && (
          <div style={{ background: "white", borderRadius: "20px", border: "1px solid #f1f5f9", padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "#94a3b8" }} />
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>Vérification de votre établissement...</span>
          </div>
        )}

        {!schoolTypeLoading && !isAuthorizedSchool && (
          <div style={{ background: "white", borderRadius: "20px", border: "2px solid #fecaca", padding: "60px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px" }}>
            <div style={{ width: "72px", height: "72px", background: "rgba(220,38,38,0.08)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <XCircle size={36} color="#dc2626" />
            </div>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>
                Module non disponible pour cet établissement
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#64748b", maxWidth: "500px", lineHeight: "1.6" }}>
                Le <strong>Relevé de Compétences</strong> est un document officiel spécifique aux centres
                de <strong>formation professionnelle agro-pastorale</strong> (type AGRO / TECHNIQUE),
                comme le <strong>CFPPAS GAO</strong>.
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                Il utilise un barème sur 100 avec des seuils de passage par module, conforme au référentiel
                de la DNETP (Direction Nationale de l&apos;Enseignement Technique et Professionnel).
              </p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Type de votre établissement :</span>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#475569", background: "#e2e8f0", padding: "3px 10px", borderRadius: "8px" }}>
                {schoolType ?? "Non défini"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              Pour les bulletins classiques (sur 20), utilisez le module{" "}
              <a href="/reports/bulletins" style={{ color: "#4f8ef7", fontWeight: 700, textDecoration: "none" }}>Bulletins de Notes</a>.
            </p>
          </div>
        )}

        {/* ── CONTENU PRINCIPAL (seulement si école autorisée) ── */}
        {!schoolTypeLoading && isAuthorizedSchool && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Toolbar */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px 24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>

          {/* Badge CFPPAS */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(22,101,52,0.08)", borderRadius: "10px", padding: "8px 14px", marginBottom: "auto", marginTop: "auto" }}>
            <Award size={15} color="#16a34a" />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>Format Officiel CFPPAS • Notes /100</span>
          </div>

          {/* Recherche */}
          <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Rechercher un apprenant</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "0 14px" }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nom, prenom ou matricule..."
                style={{ border: "none", background: "transparent", padding: "11px 0", fontSize: "13px", outline: "none", width: "100%" }}
              />
              {isLoading && <Loader2 size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />}
            </div>
            {showDropdown && students.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", zIndex: 50, maxHeight: "240px", overflowY: "auto" }}>
                {students.map(s => (
                  <div key={s.id} onClick={() => handleSelectStudent(s)}
                    style={{ padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f8fafc", fontSize: "13px" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                  >
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{s.firstName} {s.lastName}</span>
                    <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "11px" }}>{s.studentNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Annee */}
          <div style={{ minWidth: "190px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Annee / Promotion</label>
            <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: "12px", fontSize: "13px", outline: "none", background: "white", fontWeight: 600 }}>
              <option value="">-- Choisir --</option>
              {years.map((y: any) => <option key={y.id} value={y.id}>{y.name} {y.isActive ? "(En cours)" : ""}</option>)}
            </select>
          </div>

          {/* Bouton */}
          <button
            onClick={loadPreview}
            disabled={!selectedStudent || !selectedYearId || loadingPreview}
            style={{ padding: "11px 20px", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: (!selectedStudent || !selectedYearId) ? 0.5 : 1 }}
          >
            {loadingPreview ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={15} />}
            Charger
          </button>
        </div>

        {/* Loading */}
        {loadingPreview && (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#94a3b8" }}>
            <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "#16a34a" }} />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Chargement du releve...</span>
          </div>
        )}

        {/* Preview du releve */}
        {!loadingPreview && preview && (
          <div style={{ background: "white", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", color: "white", padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>Releve de Competences Officiel</div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 900 }}>
                    {preview.student.firstName} {preview.student.lastName.toUpperCase()}
                  </h2>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
                    <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>Matricule : {preview.student.studentNumber}</span>
                    <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>Promotion : {preview.enrollment.academicYear}</span>
                    <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>Specialite : {preview.enrollment.stream || preview.enrollment.level || preview.enrollment.classroom}</span>
                  </div>
                </div>
                {/* Score global */}
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "16px", padding: "16px 20px", textAlign: "center", minWidth: "140px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: "36px", fontWeight: 900, color: preview.summary.admis ? "#4ade80" : "#f87171", lineHeight: 1 }}>{preview.summary.noteGlobale}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginTop: "4px", marginBottom: "8px" }}>Moy. / 100</div>
                  <div style={{ background: preview.summary.admis ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)", color: preview.summary.admis ? "#4ade80" : "#f87171", borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 800 }}>
                    {preview.summary.admis ? "ADMIS(E)" : "NON ADMIS(E)"}
                  </div>
                </div>
              </div>

              {/* Bouton PDF */}
              <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={generatePDF} disabled={isGenerating === preview.student.id}
                  style={{ padding: "10px 20px", background: "white", color: "#0f172a", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                  {isGenerating === preview.student.id ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={15} />}
                  Telecharger PDF Officiel
                </button>
              </div>
            </div>

            {/* Stats rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1px", background: "#f1f5f9" }}>
              {[
                { label: "Modules Total", value: preview.summary.totalModules.toString(), color: "#475569" },
                { label: "Modules Valides", value: `${preview.summary.modulesReussis}`, color: "#16a34a" },
                { label: "Modules Echoues", value: `${preview.summary.totalModules - preview.summary.modulesReussis}`, color: "#dc2626" },
                { label: "Taux de Reussite", value: `${preview.summary.totalModules > 0 ? Math.round(preview.summary.modulesReussis / preview.summary.totalModules * 100) : 0}%`, color: "#2563eb" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "white", padding: "14px 18px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginTop: "2px" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tableau des modules */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    {["N°", "Titre du Module", "Duree (H)", "Seuil (%)", "Note (/100)", "Resultat"].map(h => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Titre du Module" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.moduleResults.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>{m.numero}</td>
                      <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{m.titreModule}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>{m.duree ?? "--"}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>{m.seuil}%</td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: "14px", color: m.reussi ? "#15803d" : "#dc2626" }}>
                          {m.note % 1 === 0 ? m.note : m.note.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "99px", fontSize: "11px", fontWeight: 800, background: m.reussi ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: m.reussi ? "#15803d" : "#dc2626" }}>
                          {m.reussi ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {m.resultat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer recap */}
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {preview.summary.admis ? <CheckCircle2 size={20} color="#16a34a" /> : <XCircle size={20} color="#dc2626" />}
                <span style={{ fontWeight: 800, fontSize: "15px", color: preview.summary.admis ? "#15803d" : "#dc2626" }}>
                  {preview.summary.admis ? "ADMIS(E) - Formation completement validee" : `NON ADMIS(E) - ${preview.summary.totalModules - preview.summary.modulesReussis} module(s) a reprendre`}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                Moyenne globale : <strong style={{ color: "#1e293b" }}>{preview.summary.noteGlobale} / 100</strong>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loadingPreview && !preview && (
          <div style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: "20px", padding: "64px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <FileText size={28} color="#94a3b8" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#475569" }}>Selectionner un apprenant</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", maxWidth: "380px" }}>
              Recherchez un apprenant et selectionnez la promotion pour generer son Releve de Competences officiel CFPPAS.
            </p>
          </div>
        )}

          </div>
        )}{/* fin isAuthorizedSchool */}



      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
