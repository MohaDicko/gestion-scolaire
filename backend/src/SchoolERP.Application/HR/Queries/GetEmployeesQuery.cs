using MediatR;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Application.Common.Models;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.HR.Queries.GetEmployees;

public record GetEmployeesQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    Guid? DepartmentId = null,
    bool? IsActive = true,
    decimal? MaxBaseSalary = null
) : IRequest<PaginatedResult<EmployeeDto>>;

public record EmployeeDto(
    Guid Id,
    string FirstName,
    string LastName,
    string EmployeeNumber,
    string Email,
    string PhoneNumber,
    string EmployeeType,
    string? DepartmentName,
    bool IsActive,
    string? PhotoUrl = null
);

public class GetEmployeesQueryHandler : IRequestHandler<GetEmployeesQuery, PaginatedResult<EmployeeDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEmployeesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PaginatedResult<EmployeeDto>> Handle(GetEmployeesQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var query = db.Set<Employee>().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(e => 
                e.FirstName.ToLower().Contains(search) || 
                e.LastName.ToLower().Contains(search) || 
                e.EmployeeNumber.ToLower().Contains(search) ||
                e.Email.ToLower().Contains(search));
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == request.DepartmentId.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(e => e.IsActive == request.IsActive.Value);
        }

        if (request.MaxBaseSalary.HasValue)
        {
            query = query.Where(e => e.Contracts.Any(c => c.Status == ContractStatus.Active && c.BaseSalary <= request.MaxBaseSalary.Value));
        }

        var count = await query.CountAsync(cancellationToken);
        
        var items = await query
            .Include(e => e.Department)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EmployeeDto(
                e.Id,
                e.FirstName,
                e.LastName,
                e.EmployeeNumber,
                e.Email,
                e.PhoneNumber,
                e.EmployeeType.ToString(),
                e.Department != null ? e.Department.Name : null,
                e.IsActive,
                e.PhotoUrl
            ))
            .ToListAsync(cancellationToken);

        return PaginatedResult<EmployeeDto>.Create(items, count, request.PageNumber, request.PageSize);
    }
}
