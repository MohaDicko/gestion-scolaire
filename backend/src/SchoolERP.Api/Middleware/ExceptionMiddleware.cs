using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SchoolERP.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        
        var statusCode = exception switch
        {
            SchoolERP.Domain.Exceptions.NotFoundException => (int)HttpStatusCode.NotFound,
            SchoolERP.Domain.Exceptions.ForbiddenException => (int)HttpStatusCode.Forbidden,
            SchoolERP.Domain.Exceptions.DomainException => (int)HttpStatusCode.UnprocessableEntity,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            InvalidOperationException or ArgumentException => (int)HttpStatusCode.BadRequest,
            FluentValidation.ValidationException => (int)HttpStatusCode.UnprocessableEntity,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var response = new ProblemDetails
        {
            Status = statusCode,
            Title = exception switch 
            {
                FluentValidation.ValidationException => "Validation Error",
                _ => exception.GetType().Name
            },
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        if (exception is FluentValidation.ValidationException valEx)
        {
            var errors = valEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );
            response.Extensions["errors"] = errors;
        }

        if (_env.IsDevelopment())
        {
            response.Extensions["trace"] = exception.StackTrace;
        }

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        await context.Response.WriteAsync(json);
    }
}
