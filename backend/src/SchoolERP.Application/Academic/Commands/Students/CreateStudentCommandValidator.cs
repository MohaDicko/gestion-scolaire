using FluentValidation;

namespace SchoolERP.Application.Academic.Commands.Students;

public class CreateStudentCommandValidator : AbstractValidator<CreateStudentCommand>
{
    public CreateStudentCommandValidator()
    {
        RuleFor(v => v.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.LastName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.DateOfBirth).NotEmpty().LessThan(DateTime.Today);
        RuleFor(v => v.NationalId).NotEmpty().MaximumLength(50)
            .WithMessage("National ID is required and must not exceed 50 characters.");
        RuleFor(v => v.ParentName).NotEmpty().MaximumLength(150);
        RuleFor(v => v.ParentPhone).NotEmpty().Matches(@"^\+?[0-9\s-]{8,20}$")
            .WithMessage("Invalid phone number format.");
        RuleFor(v => v.ParentEmail).EmailAddress().When(v => !string.IsNullOrEmpty(v.ParentEmail));
        RuleFor(v => v.ParentRelationship).NotEmpty().MaximumLength(50);
    }
}
