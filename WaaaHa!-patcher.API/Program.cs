using Microsoft.Extensions.FileProviders;
using System.Reflection;
using WaaaHa__patcher.API.Utilities;

WelcomeMessage.Print();

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);

builder.WebHost.UseUrls("http://127.0.0.1:0");

var app = builder.Build();

var embeddedProvider = new EmbeddedFileProvider(Assembly.GetExecutingAssembly(), "WaaaHa__patcher.API.wwwroot");

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = embeddedProvider
});

app.MapFallbackToFile("index.html", new StaticFileOptions
{
    FileProvider = embeddedProvider
});

app.Lifetime.ApplicationStarted.Register(() =>
{
    var url = app.Urls.FirstOrDefault();

    if (string.IsNullOrEmpty(url))
        return;

    Autoexec.PrintUrl(url);
    Autoexec.OpenUrl(url);
});

app.Run();
