using FluentAssertions;
using SchoolERP.Application.Academic.Commands.Students;
using SchoolERP.Domain.Enums;
using Xunit;

namespace SchoolERP.Application.UnitTests.Academic.Commands.Students;

public class CreateStudentCommandValidatorTests
{
    private readonly CreateStudentCommandValidator _validator;

    public CreateStudentCommandValidatorTests()
    {
        _validator = new CreateStudentCommandValidator();
    }

    private CreateStudentCommand CreateValidCommand() => new(
        FirstName: "Jean",
        LastName: "Dupont",
        DateOfBirth: DateTime.Today.AddYears(-10),
        Gender: Gender.Male,
        NationalId: "CI1234567",
        ParentName: "Paul Dupont",
        ParentPhone: "0707070707",
        ParentEmail: "paul.dupont@example.com",
        ParentRelationship: "Father",
        CampusId: Guid.NewGuid()
    );

    [Fact]
    public void Should_Be_Valid_When_All_Fields_Are_Valid()
    {
        var command = CreateValidCommand();
        var result = _validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Should_Have_Error_When_FirstName_Is_Empty(string firstName)
    {
        var command = CreateValidCommand() with { FirstName = firstName };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "FirstName");
    }

    [Fact]
    public void Should_Have_Error_When_FirstName_Exceeds_100_Characters()
    {
        var command = CreateValidCommand() with { FirstName = new string('A', 101) };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "FirstName");
    }

    [Fact]
    public void Should_Have_Error_When_DateOfBirth_Is_Today_Or_Future()
    {
        var command = CreateValidCommand() with { DateOfBirth = DateTime.Today };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth");

        var commandFuture = CreateValidCommand() with { DateOfBirth = DateTime.Today.AddDays(1) };
        var resultFuture = _validator.Validate(commandFuture);
        resultFuture.Errors.Should().Contain(e => e.PropertyName == "DateOfBirth");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Should_Have_Error_When_ParentName_Is_Empty(string parentName)
    {
        var command = CreateValidCommand() with { ParentName = parentName };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "ParentName");
    }

    [Theory]
    [InlineData("12345")] // Too short
    [InlineData("123456789012345678901")] // Too long
    [InlineData("invalid-phone")] // Invalid characters
    public void Should_Have_Error_When_ParentPhone_Is_Invalid(string phone)
    {
        var command = CreateValidCommand() with { ParentPhone = phone };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "ParentPhone");
    }

    [Fact]
    public void Should_Be_Valid_When_ParentEmail_Is_Empty()
    {
        var command = CreateValidCommand() with { ParentEmail = "" };
        var result = _validator.Validate(command);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Have_Error_When_ParentEmail_Is_Invalid()
    {
        var command = CreateValidCommand() with { ParentEmail = "invalid-email" };
        var result = _validator.Validate(command);
        result.Errors.Should().Contain(e => e.PropertyName == "ParentEmail");
    }
}
