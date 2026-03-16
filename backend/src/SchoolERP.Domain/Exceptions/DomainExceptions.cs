namespace SchoolERP.Domain.Exceptions;

/// <summary>
/// Thrown when a business/domain rule is violated.
/// These are expected errors, not bugs — they should be caught and returned as 422 Unprocessable Entity.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception inner) : base(message, inner) { }
}

/// <summary>
/// Thrown when a requested entity is not found.
/// Mapped to 404 Not Found in the API layer.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string entityName, object key)
        : base($"Entity '{entityName}' with key '{key}' was not found.") { }
}

/// <summary>
/// Thrown when the current user is not authorized to perform an action.
/// Mapped to 403 Forbidden in the API layer.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "You are not authorized to perform this action.")
        : base(message) { }
}
