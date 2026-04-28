# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore first (IMPORTANT)
COPY *.csproj ./
RUN dotnet restore

# Copy everything else
COPY . ./

# Publish app
RUN dotnet publish -c Release -o /app/out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/out .

# Set port
ENV PORT=10000
EXPOSE 10000

# Start app
ENTRYPOINT ["dotnet", "MobileApi.dll"]