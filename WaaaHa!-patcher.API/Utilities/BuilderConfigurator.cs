using WaaaHa__patcher.API.Services;

namespace WaaaHa__patcher.API.Utilities
{
    public static class BuilderConfigurator
    {
        public static void ConfigureThis(WebApplicationBuilder builder)
        {
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Information);
            builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);

            builder.WebHost.UseUrls("http://127.0.0.1:0");

            builder.Services.AddControllers();

            builder.Services.AddSingleton<FileSystemManager>();
            builder.Services.AddSingleton<LuaPseudoReader>();
        }
    }
}
