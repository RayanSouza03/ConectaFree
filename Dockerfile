FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ConectaFree.csproj ./

RUN dotnet restore

COPY . .

RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "dotnet ConectaFree.dll --urls http://0.0.0.0:${PORT:-8080}"]
