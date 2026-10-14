using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace WaaaHa__patcher.API.Utilities
{
    public static class AppConfigurator
    {
        public static void ConfigureThis(WebApplication app)
        {
            app.UseCors("local-web");

            app.MapControllers();

            var embeddedProvider = new EmbeddedFileProvider(Assembly.GetExecutingAssembly(), "WaaaHa__patcher.API.wwwroot");

            app.Use(async (context, next) =>
            {
                if (WantsPage(context.Request))
                {
                    context.Request.Path = "/index.html";
                }

                await next();
            });

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = embeddedProvider
            });
        }

        /// <summary>
        /// Просит ли клиент страницу, а не ресурс.
        ///
        /// Экран живёт по адресу вида /profiles/Profile1/MY_HOTKEYS.LUA, и после
        /// перезагрузки браузер спрашивает именно его. Такой страницы в сборке нет, и
        /// стандартный MapFallbackToFile её пропускает: имя файла набора само выглядит
        /// как файл. Отличить можно только по Accept — на переходе браузер просит
        /// text/html, а картинку, скрипт или стиль запрашивает без него. Такие запросы
        /// и должны честно получать 404, если файла нет.
        /// </summary>
        public static bool WantsPage(HttpRequest request)
            => !request.Path.StartsWithSegments("/api")
               && request.Headers.Accept.Any(value =>
                   value is not null && value.Contains("text/html", StringComparison.OrdinalIgnoreCase));
    }
}
