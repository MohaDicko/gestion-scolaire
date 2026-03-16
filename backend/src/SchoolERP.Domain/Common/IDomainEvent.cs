namespace SchoolERP.Domain.Common;

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}
