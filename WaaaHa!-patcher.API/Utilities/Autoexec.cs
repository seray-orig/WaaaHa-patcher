using System.Diagnostics;

namespace WaaaHa__patcher.API.Utilities
{
    public static class Autoexec
    {
        public static void Register(WebApplication app)
        {
            app.Lifetime.ApplicationStarted.Register(() =>
            {
                var url = app.Urls.FirstOrDefault();

                if (string.IsNullOrEmpty(url))
                    return;

                PrintUrl(url);
                OpenUrl(url);
            });
        }

        private static void OpenUrl(string url)
        {
            try
            {
                if (OperatingSystem.IsWindows())
                {
                    Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                }
                else if (OperatingSystem.IsLinux())
                {
                    Process.Start("xdg-open", url);
                }
                else if (OperatingSystem.IsMacOS())
                {
                    Process.Start("open", url);
                }
            }
            catch
            {
                // Браузер мог не запуститься — это не повод ронять приложение.
            }
        }

        private static void PrintUrl(string url)
        {
            var previousColor1 = Console.ForegroundColor;
            var previousColor2 = Console.BackgroundColor;

            try
            {
                var label = " OPEN IN BROWSER: ";
                var line = $" {label}{url} ";

                // При перенаправленном выводе ширины окна нет, и обращаться к ней нельзя.
                var width = TryGetWindowWidth();
                var padding = width > line.Length ? (width - line.Length) / 2 : 0;

                Console.WriteLine();
                Console.WriteLine(new string(' ', Math.Max(padding, 0)));

                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.BackgroundColor = ConsoleColor.DarkYellow;
                Console.Write(label);

                Console.ForegroundColor = ConsoleColor.Black;
                Console.BackgroundColor = ConsoleColor.White;
                Console.WriteLine($" {url} ");

                Console.WriteLine();
            }
            catch
            {
                Console.WriteLine($" {url}");
            }
            finally
            {
                Console.ForegroundColor = previousColor1;
                Console.BackgroundColor = previousColor2;
            }
        }

        private static int TryGetWindowWidth()
        {
            try
            {
                return Console.WindowWidth;
            }
            catch (IOException)
            {
                return 0;
            }
        }
    }
}