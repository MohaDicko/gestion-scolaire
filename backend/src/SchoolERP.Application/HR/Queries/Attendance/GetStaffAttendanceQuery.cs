using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.HR.Queries.GetStaffAttendance;

public record GetStaffAttendanceQuery(DateTime Date) : IRequest<List<StaffAttendanceDto>>;

public record StaffAttendanceDto(
    Guid EmployeeId,
    string EmployeeName,
    StaffAttendanceStatus Status,
    string Remarks,
    DateTime? CheckIn,
    DateTime? CheckOut
);

public class GetStaffAttendanceQueryHandler : IRequestHandler<GetStaffAttendanceQuery, List<StaffAttendanceDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetStaffAttendanceQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<StaffAttendanceDto>> Handle(GetStaffAttendanceQuery request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var date = request.Date.Date;

        var employees = await db.Set<Employee>()
            .Where(e => e.IsActive)
            .Select(e => new { e.Id, Name = $"{e.FirstName} {e.LastName}" })
            .ToListAsync(cancellationToken);

        var attendance = await db.Set<StaffAttendance>()
            .Where(a => a.Date == date)
            .ToListAsync(cancellationToken);

        return employees.Select(e => {
            var record = attendance.FirstOrDefault(a => a.EmployeeId == e.Id);
            return new StaffAttendanceDto(
                e.Id,
                e.Name,
                record?.Status ?? StaffAttendanceStatus.Absent, // Default to absent if no record
                record?.Remarks ?? string.Empty,
                record?.CheckInTime,
                record?.CheckOutTime
            );
        }).ToList();
    }
}
