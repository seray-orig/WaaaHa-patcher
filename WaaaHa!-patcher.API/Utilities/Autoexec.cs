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
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch {}
        }

        private static void PrintUrl(string url)
        {
            var previousColor1 = Console.ForegroundColor;
            var previousColor2 = Console.BackgroundColor;

            var label = " OPEN IN BROWSER: ";
            var line = $" {label}{url} ";

            // Похер. Берём половину ширины окна по умолчанию.
            var padding = 120 > line.Length ? (120 - line.Length) / 2 : 0;

            Console.WriteLine();
            Console.Write(new string(' ', Math.Max(padding, 0)));

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.BackgroundColor = ConsoleColor.DarkYellow;
            Console.Write(label);

            Console.ForegroundColor = ConsoleColor.Black;
            Console.BackgroundColor = ConsoleColor.White;
            Console.Write($" {url} ");

            Console.WriteLine();

            Console.ForegroundColor = previousColor1;
            Console.BackgroundColor = previousColor2;
        }
    }
}