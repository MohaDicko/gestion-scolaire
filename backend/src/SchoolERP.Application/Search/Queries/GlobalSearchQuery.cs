using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Finance;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.Search.Queries;

public record GlobalSearchQuery(string Term) : IRequest<GlobalSearchResult>;

public record GlobalSearchResult(
    List<SearchItem> Students,
    List<SearchItem> Employees,
    List<SearchItem> Invoices
);

public record SearchItem(
    Guid Id,
    string Title,
    string Subtitle,
    string Category,
    string Path
);

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, GlobalSearchResult>
{
    private readonly IUnitOfWork _unitOfWork;

    public GlobalSearchQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<GlobalSearchResult> Handle(GlobalSearchQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var term = request.Term.ToLower().Trim();

        if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            return new GlobalSearchResult([], [], []);

        // Students
        var students = await db.Set<Student>()
            .Where(s => s.FirstName.ToLower().Contains(term)
                     || s.LastName.ToLower().Contains(term)
                     || s.StudentNumber.ToLower().Contains(term)
                     || s.ParentName.ToLower().Contains(term))
            .Take(5)
            .Select(s => new SearchItem(
                s.Id,
                $"{s.FirstName} {s.LastName}",
                $"Matricule: {s.StudentNumber}",
                "Élève",
                $"/academic/students/{s.Id}"
            ))
            .ToListAsync(cancellationToken);

        // Employees
        var employees = await db.Set<Employee>()
            .Where(e => e.FirstName.ToLower().Contains(term)
                     || e.LastName.ToLower().Contains(term)
                     || e.Email.ToLower().Contains(term))
            .Take(5)
            .Select(e => new SearchItem(
                e.Id,
                $"{e.FirstName} {e.LastName}",
                e.Email,
                "Employé",
                $"/hr/employees"
            ))
            .ToListAsync(cancellationToken);

        // Invoices
        var invoices = await db.Set<StudentInvoice>()
            .Include(i => i.Student)
            .Where(i => i.InvoiceNumber.ToLower().Contains(term)
                     || i.Description.ToLower().Contains(term)
                     || (i.Student != null &&
                         (i.Student.FirstName.ToLower().Contains(term)
                       || i.Student.LastName.ToLower().Contains(term))))
            .Take(5)
            .Select(i => new SearchItem(
                i.Id,
                i.Description,
                $"{i.InvoiceNumber} — {(i.Student != null ? i.Student.FirstName + " " + i.Student.LastName : "")}",
                "Facture",
                $"/finance/invoices"
            ))
            .ToListAsync(cancellationToken);

        return new GlobalSearchResult(students, employees, invoices);
    }
}
