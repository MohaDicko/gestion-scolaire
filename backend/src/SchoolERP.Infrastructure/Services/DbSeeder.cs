using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Infrastructure.Persistence;

namespace SchoolERP.Infrastructure.Services;

public class DbSeeder
{
    private readonly AppDbContext _context;

    public DbSeeder(AppDbContext context)
    {
        _context = context;
    }

    public async Task SeedProfessionalSections(Guid tenantId)
    {
        // ── SCHOOL SECTIONS (CYCLES) ─────────────────────────────
        var sections = new List<SchoolSection>
        {
            SchoolSection.Create(tenantId, "Crèche & Garderie", "CRECHE", 10, "Petite enfance"),
            SchoolSection.Create(tenantId, "Jardin d'Enfants", "MATER", 10, "Maternelle"),
            SchoolSection.Create(tenantId, "Enseignement Fondamental (1er Cycle)", "PRIM", 10, "Primaire 1ère-6ème"),
            SchoolSection.Create(tenantId, "Enseignement Fondamental (2ème Cycle)", "COLL", 20, "Second cycle 7ème-9ème"),
            SchoolSection.Create(tenantId, "Lycée (Enseignement Général)", "LYCEE", 20, "10ème, 11ème, Terminale (BAC)"),
            SchoolSection.Create(tenantId, "Enseignement Technique & Pro", "TECH", 20, "Filières professionnelles après DEF")
        };

        foreach (var section in sections)
        {
            if (!_context.SchoolSections.Any(s => s.Code == section.Code && s.TenantId == tenantId))
            {
                _context.SchoolSections.Add(section);
            }
        }
        await _context.SaveChangesAsync();

        // Get IDs of relevant sections
        var lyceeId = _context.SchoolSections.First(s => s.Code == "LYCEE" && s.TenantId == tenantId).Id;
        var proId = _context.SchoolSections.First(s => s.Code == "TECH" && s.TenantId == tenantId).Id;

        // ── SPECIALTIES (SÉRIES) ─────────────────────────────────
        var specialties = new List<Specialty>
        {
            // LYCEE - 10ème année
            Specialty.Create(tenantId, "10ème Science", "10S", lyceeId, null, "Tronc commun scientifique"),
            Specialty.Create(tenantId, "10ème Lettre", "10L", lyceeId, null, "Tronc commun littéraire"),

            // LYCEE - 11ème & Terminale
            Specialty.Create(tenantId, "Sciences Sociaels", "TSS", lyceeId, null, "Filière des Sciences Sociales"),
            Specialty.Create(tenantId, "Art Dramatique & Littérature", "TAL", lyceeId, null, "Filière des Arts et Lettres"),
            Specialty.Create(tenantId, "Langues et Littérature", "TLL", lyceeId, null, "Filière des Langues"),
            Specialty.Create(tenantId, "Sciences Exactes", "TSE", lyceeId, null, "Filière de Mathématiques (BAC SE)"),
            Specialty.Create(tenantId, "Sciences Expérimentales", "TSEXP", lyceeId, null, "Filière Biologie/Chimie (BAC SET)"),
            Specialty.Create(tenantId, "Sciences Économiques", "TSECO", lyceeId, null, "Filière des Sciences Économiques"),

            // PROFESSIONNEL
            Specialty.Create(tenantId, "Secrétariat de Direction", "SEC_DIR", proId, 150000, "Spécialité administrative"),
            Specialty.Create(tenantId, "Comptabilité et Gestion", "COMPTA", proId, 150000, "Spécialité financière"),
            Specialty.Create(tenantId, "Santé - Infirmier d'État", "INF_ETAT", proId, 350000, "Spécialité Santé"),
            Specialty.Create(tenantId, "Santé - Sage-femme", "SAGE_FEMME", proId, 450000, "Spécialité Santé"),
            Specialty.Create(tenantId, "Élevage & Agriculture", "AGRO_PASTO", proId, 200000, "Spécialité Agropastorale")
        };

        foreach (var specialty in specialties)
        {
            if (!_context.Specialties.Any(sp => sp.Code == specialty.Code && sp.TenantId == tenantId))
            {
                _context.Specialties.Add(specialty);
            }
        }
        await _context.SaveChangesAsync();
    }
}
