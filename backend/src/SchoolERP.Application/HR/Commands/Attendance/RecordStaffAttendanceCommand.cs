using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Interfaces;

namespace SchoolERP.Application.HR.Commands.RecordStaffAttendance;

public record RecordStaffAttendanceCommand(
    DateTime Date,
    List<StaffAttendanceEntry> Entries
) : IRequest;

public record StaffAttendanceEntry(
    Guid EmployeeId,
    StaffAttendanceStatus Status,
    string Remarks = "",
    DateTime? CheckIn = null,
    DateTime? CheckOut = null
);

public class RecordStaffAttendanceCommandHandler : IRequestHandler<RecordStaffAttendanceCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public RecordStaffAttendanceCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task Handle(RecordStaffAttendanceCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var tenantId = _tenantService.GetCurrentTenantId();
        var date = request.Date.Date;

        var existingAttendance = await db.Set<StaffAttendance>()
            .Where(a => a.Date == date)
            .ToListAsync(cancellationToken);

        foreach (var entry in request.Entries)
        {
            var record = existingAttendance.FirstOrDefault(a => a.EmployeeId == entry.EmployeeId);
            if (record != null)
            {
                record.Update(entry.Status, entry.Remarks, entry.CheckIn, entry.CheckOut);
            }
            else
            {
                var newRecord = StaffAttendance.Create(
                    tenantId,
                    entry.EmployeeId,
                    date,
                    entry.Status,
                    entry.Remarks,
                    entry.CheckIn, entry.CheckOut
                );
                await db.Set<StaffAttendance>().AddAsync(newRecord, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
