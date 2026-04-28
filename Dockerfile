# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy everything
COPY . ./

# Publish app
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/out .

# Expose port
ENV PORT=10000
EXPOSE 10000

# Start app
ENTRYPOINT ["dotnet", "MobileApi.dll"]s