cd C:\Users\STARSTEAM_X\Documents\GitHub\ArtSpace\Backend
del /Q /S Migrations\*
dotnet ef database drop --force --verbose
dotnet ef migrations add initialCreate
dotnet ef database update
dotnet run