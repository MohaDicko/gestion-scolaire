using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Payroll;
using SchoolERP.Domain.Finance;

namespace SchoolERP.Application.Ai.Queries.AskAssistant;

public record AiResponse(string Message, string? ActionType = null, object? Data = null);

public record AskAssistantQuery(string Prompt) : IRequest<AiResponse>;

public class AskAssistantQueryHandler : IRequestHandler<AskAssistantQuery, AiResponse>
{
    private readonly IUnitOfWork _unitOfWork;

    public AskAssistantQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AiResponse> Handle(AskAssistantQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var prompt = request.Prompt.ToLower();

        // 1. Logic for "Statistics / Counts"
        if (prompt.Contains("combien") || prompt.Contains("nombre"))
        {
            if (prompt.Contains("élèves") || prompt.Contains("etudiants"))
            {
                var count = await db.Set<Student>().CountAsync(cancellationToken);
                return new AiResponse($"Il y a actuellement {count} élèves inscrits dans l'établissement.", "NAVIGATE_STUDENTS", new { Count = count });
            }
            if (prompt.Contains("prof") || prompt.Contains("employé"))
            {
                var count = await db.Set<Employee>().CountAsync(cancellationToken);
                return new AiResponse($"Le personnel compte {count} employés.", "NAVIGATE_HR", new { Count = count });
            }
        }

        // 1.5. Logic for Health-specific queries (Filières & Stages)
        if (prompt.Contains("smi") || prompt.Contains("ide") || prompt.Contains("filière") || prompt.Contains("spécialité"))
        {
            var specialties = await db.Set<SchoolERP.Domain.Academic.Specialty>().Select(s => s.Name).ToListAsync(cancellationToken);
            var specialtyList = string.Join(", ", specialties);
            return new AiResponse($"L'établissement propose les filières suivantes : {specialtyList}. Souhaitez-vous voir la répartition des effectifs par spécialité ?", "NAVIGATE_DASHBOARD");
        }

        if (prompt.Contains("stage") || prompt.Contains("clinique"))
        {
            return new AiResponse("La gestion des stages cliniques est intégrée dans le module de scolarité. Vous pouvez suivre les lieux de stage et les notes de pratique professionnelle dans le détail des élèves.", "NAVIGATE_ACADEMIC");
        }

        // 2. Logic for Financial queries
        if (prompt.Contains("argent") || prompt.Contains("ca") || prompt.Contains("chiffre d'affaire") || prompt.Contains("encaissé"))
        {
            var totalInvoiced = await db.Set<StudentInvoice>().SumAsync(i => i.Amount, cancellationToken);
            var totalPaid = await db.Set<StudentPayment>().SumAsync(p => p.Amount, cancellationToken);
            return new AiResponse($"Le montant total facturé est de {totalInvoiced:N0} XOF, dont {totalPaid:N0} XOF déjà encaissés.", "NAVIGATE_FINANCE", new { Invoiced = totalInvoiced, Paid = totalPaid });
        }

        // 3. Logic for Performance (High achievers)
        if (prompt.Contains("meilleur") || prompt.Contains("plus de 15") || prompt.Contains("performant"))
        {
            return new AiResponse("Je peux vous générer la liste des meilleurs élèves par classe. Souhaitez-vous que j'exporte le tableau d'honneur en Excel ?", "EXPORT_EXCEL_PROMPT");
        }

        // 4. Navigation assistance
        if (prompt.Contains("comment") || prompt.Contains("où") || prompt.Contains("aide"))
        {
            return new AiResponse("Je suis votre assistant SchoolERP. Je peux vous aider à : \n- Compter les effectifs \n- Consulter la situation financière \n- Préparer les bulletins \n- Gérer la paie. \n\nQue souhaitez-vous faire ?", "SHOW_HELP");
        }

        // Default response (Generic Assistant)
        return new AiResponse("Désolé, ma compréhension sur ce point est limitée. Essayez de me demander le nombre d'élèves ou la situation de la paie.", "RETRY");
    }
}
