using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace WaaaHa__patcher.API.Utilities
{
    public static class AppConfigurator
    {
        public static void ConfigureThis(WebApplication app)
        {
            app.MapControllers();

            var embeddedProvider = new EmbeddedFileProvider(Assembly.GetExecutingAssembly(), "WaaaHa__patcher.API.wwwroot");

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = embeddedProvider
            });

            app.MapFallbackToFile("index.html", new StaticFileOptions
            {
                FileProvider = embeddedProvider
            });
        }
    }
}
