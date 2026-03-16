using MediatR;
using Microsoft.EntityFrameworkCore;
using SchoolERP.Domain.Interfaces;
using SchoolERP.Domain.HR;
using SchoolERP.Domain.Exceptions;

namespace SchoolERP.Application.HR.Commands.UpdateLeaveStatus;

public record UpdateLeaveStatusCommand(
    Guid LeaveRequestId,
    bool IsApproved,
    string? RejectionReason = null
) : IRequest;

public class UpdateLeaveStatusCommandHandler : IRequestHandler<UpdateLeaveStatusCommand>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITenantService _tenantService;

    public UpdateLeaveStatusCommandHandler(IUnitOfWork unitOfWork, ITenantService tenantService)
    {
        _unitOfWork = unitOfWork;
        _tenantService = tenantService;
    }

    public async Task Handle(UpdateLeaveStatusCommand request, CancellationToken cancellationToken)
    {
        var db = (DbContext)_unitOfWork;
        
        var leaveRequest = await db.Set<LeaveRequest>().FindAsync(new object[] { request.LeaveRequestId }, cancellationToken);
        if (leaveRequest == null) throw new DomainException("Leave request not found.");

        // For demo, we use 'Empty' guid as approver if we can't parse string UserId to Guid
        Guid approverId = Guid.TryParse(_tenantService.GetCurrentUserId(), out var id) ? id : Guid.Empty;

        if (request.IsApproved)
        {
            var result = leaveRequest.Approve(approverId);
            if (!result.IsSuccess) throw new DomainException(result.Error ?? "Error");
        }
        else
        {
            var result = leaveRequest.Reject(approverId, request.RejectionReason ?? "No reason provided");
            if (!result.IsSuccess) throw new DomainException(result.Error ?? "Error");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
