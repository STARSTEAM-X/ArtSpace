del /Q /S wwwroot\upload\*
del /Q /S Migrations\*
dotnet ef database drop --force --verbose
dotnet ef migrations add initialCreate
dotnet ef database update
dotnet run