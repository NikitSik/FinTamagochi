# syntax=docker/dockerfile:1

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Tamagochi.sln ./
COPY Tamagochi/Tamagochi.csproj Tamagochi/
COPY Tamagochi.Tests/Tamagochi.Tests.csproj Tamagochi.Tests/
RUN dotnet restore Tamagochi.sln

COPY . ./
RUN dotnet publish Tamagochi/Tamagochi.csproj -c Release -o /app/out /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

COPY --from=build /app/out ./

CMD ["/bin/sh", "-c", "ASPNETCORE_URLS=\"http://0.0.0.0:${PORT:-8080}\" exec dotnet Tamagochi.dll"]
