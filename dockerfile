# Этап 1: билд
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# копируем всё в контейнер
COPY . .

# восстанавливаем зависимости
RUN dotnet restore Tamagochi/Tamagochi.csproj

# билдим проект
RUN dotnet publish Tamagochi/Tamagochi.csproj -c Release -o /app

# Этап 2: рантайм
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# копируем результат билда
COPY --from=build /app .

# на каком порту будет слушать ASP.NET
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

# точка входа
ENTRYPOINT ["dotnet", "Tamagochi.dll"]
