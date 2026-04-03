using FluentAssertions;
using Moq;
using SchoolERP.Application.Academic.Commands.Students;
using SchoolERP.Domain.Academic;
using SchoolERP.Domain.Enums;
using SchoolERP.Domain.Interfaces;
using Xunit;

namespace SchoolERP.Application.UnitTests.Academic.Commands.Students;

public class CreateStudentCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ITenantService> _tenantServiceMock;
    private readonly Mock<IRepository<Student>> _repositoryMock;
    private readonly CreateStudentCommandHandler _handler;

    public CreateStudentCommandHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _tenantServiceMock = new Mock<ITenantService>();
        _repositoryMock = new Mock<IRepository<Student>>();

        _handler = new CreateStudentCommandHandler(
            _unitOfWorkMock.Object,
            _tenantServiceMock.Object,
            _repositoryMock.Object
        );
    }

    [Fact]
    public async Task Handle_Should_Create_Student_And_Return_Id()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        _tenantServiceMock.Setup(t => t.GetCurrentTenantId()).Returns(tenantId);

        var command = new CreateStudentCommand(
            FirstName: "Marie",
            LastName: "Curie",
            DateOfBirth: new DateTime(2010, 1, 1),
            Gender: Gender.Female,
            NationalId: "CI12345",
            ParentName: "Pierre Curie",
            ParentPhone: "0707070707",
            ParentEmail: "pierre@example.com",
            ParentRelationship: "Father",
            CampusId: Guid.NewGuid()
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();

        _tenantServiceMock.Verify(t => t.GetCurrentTenantId(), Times.Once);
        
        _repositoryMock.Verify(r => r.AddAsync(
            It.Is<Student>(s => 
                s.TenantId == tenantId &&
                s.FirstName == "Marie" &&
                s.LastName == "Curie" &&
                s.ParentName == "Pierre Curie" &&
                s.ParentPhone == "0707070707"),
            It.IsAny<CancellationToken>()
        ), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
