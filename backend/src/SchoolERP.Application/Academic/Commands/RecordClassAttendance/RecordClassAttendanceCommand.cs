using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;

namespace SchoolERP.Application.Academic.Commands.RecordClassAttendance;

public record RecordClassAttendanceCommand(
    Guid ClassroomId,
    DateTime Date,
    List<StudentAttendanceInput> Attendances
) : IRequest;

public record StudentAttendanceInput(
    Guid StudentId,
    int Status, // 0=Present, 1=Absent, 2=Late, 3=Excused
    string Remarks
);

public class RecordClassAttendanceCommandHandler : IRequestHandler<RecordClassAttendanceCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public RecordClassAttendanceCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task Handle(RecordClassAttendanceCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        var date = request.Date.Date;

        var existingRecords = await db.Set<Attendance>()
            .Where(a => a.ClassroomId == request.ClassroomId && a.Date == date)
            .ToDictionaryAsync(a => a.StudentId, cancellationToken);

        foreach (var input in request.Attendances)
        {
            var status = (AttendanceStatus)input.Status;

            if (existingRecords.TryGetValue(input.StudentId, out var existing))
            {
                // Update
                existing.UpdateStatus(status, input.Remarks);
            }
            else
            {
                // Create new
                var newAttendance = Attendance.Create(
                    _tenantService.GetCurrentTenantId(),
                    input.StudentId,
                    request.ClassroomId,
                    date,
                    status,
                    input.Remarks ?? ""
                );
                await db.Set<Attendance>().AddAsync(newAttendance, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
