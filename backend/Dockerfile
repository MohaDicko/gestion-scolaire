# Dockerfile for .NET 8 Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all projects
COPY ["src/SchoolERP.Api/SchoolERP.Api.csproj", "SchoolERP.Api/"]
COPY ["src/SchoolERP.Application/SchoolERP.Application.csproj", "SchoolERP.Application/"]
COPY ["src/SchoolERP.Domain/SchoolERP.Domain.csproj", "SchoolERP.Domain/"]
COPY ["src/SchoolERP.Infrastructure/SchoolERP.Infrastructure.csproj", "SchoolERP.Infrastructure/"]

# Restore dependencies
RUN dotnet restore "SchoolERP.Api/SchoolERP.Api.csproj"

# Copy the rest of the source code
COPY src/ .

# Build and publish
WORKDIR "/src/SchoolERP.Api"
RUN dotnet publish "SchoolERP.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Environment variables
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SchoolERP.Api.dll"]
