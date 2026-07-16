using WaaaHa__patcher.API.Utilities;

WelcomeMessage.Print();

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.Run();
