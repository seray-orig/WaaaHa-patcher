using WaaaHa__patcher.API.Application;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Domain.Profiles;

namespace WaaaHa__patcher.API.Utilities
{
    public static class BuilderConfigurator
    {
        public static void ConfigureThis(WebApplicationBuilder builder)
        {
            builder.Logging.ClearProviders();
            builder.Logging.AddConsole();
            builder.Logging.SetMinimumLevel(LogLevel.Information);

            // Логи хоста приглушены. «Hosting environment» и «Content root path» для
            // настольной программы ничего не значат, а адрес запуска приложение и так
            // печатает само — своей полосой по центру окна. Заодно снимается причина
            // битой строки: эти сообщения писались из своего потока и вклинивались
            // посреди надписи, пока та печаталась по кускам.
            builder.Logging.AddFilter("Microsoft", LogLevel.Warning);

            // Порт по умолчанию выбирает операционная система: так приложение не мешает
            // другим локальным серверам. Для режима разработки адрес задаётся переменной
            // окружения WAAAHA_URLS, иначе фронтенд не знает, куда проксировать запросы.
            builder.WebHost.UseUrls(
                Environment.GetEnvironmentVariable("WAAAHA_URLS") ?? "http://127.0.0.1:0");

            builder.Services
                .AddControllers(options => options.Filters.Add<HotkeyExceptionFilter>())
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
                });

            builder.Services.AddCors(options => options.AddPolicy("local-web", policy => policy
                .SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .AllowAnyMethod()));

            RegisterDomain(builder);
        }

        private static void RegisterDomain(WebApplicationBuilder builder)
        {
            builder.Services.AddSingleton<IKeyRegistry, KeyRegistry>();
            builder.Services.AddSingleton<IBindingValueValidator, BindingValueValidator>();
            builder.Services.AddSingleton<ILuaBindingsParser, LuaBindingsParser>();
            builder.Services.AddSingleton<ILuaBindingsWriter, LuaBindingsWriter>();
            

            builder.Services.AddSingleton<IGamePathsProvider, GamePathsProvider>();
            builder.Services.AddSingleton<IProfileRepository, ProfileRepository>();
            builder.Services.AddSingleton<IHotkeySetRepository, HotkeySetRepository>();

            builder.Services.AddSingleton<IHotkeyGroupResolver, HotkeyGroupResolver>();
            builder.Services.AddSingleton<IHotkeyCategoryResolver, HotkeyCategoryResolver>();
            builder.Services.AddSingleton<IShellLauncher, WindowsShellLauncher>();
            builder.Services.AddSingleton<IHotkeySetService, HotkeySetService>();
        }
    }
}