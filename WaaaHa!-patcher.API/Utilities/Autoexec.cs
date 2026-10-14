using System.Diagnostics;
using System.IO;

namespace WaaaHa__patcher.API.Utilities
{
    public static class Autoexec
    {
        /// <summary>Ширина, из которой считается центрирование, когда окна консоли нет.</summary>
        private const int FallbackConsoleWidth = 120;

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
            var label = " OPEN IN BROWSER: ";
            var line = $" {label}{url} ";

            var previousForeground = Console.ForegroundColor;
            var previousBackground = Console.BackgroundColor;

            Console.Write($"\n{new string(' ', Centering(line.Length))}");

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.BackgroundColor = ConsoleColor.DarkYellow;
            Console.Write(label);

            Console.ForegroundColor = ConsoleColor.Black;
            Console.BackgroundColor = ConsoleColor.White;
            Console.Write($" {url} ");

            Console.ForegroundColor = previousForeground;
            Console.BackgroundColor = previousBackground;

            Console.WriteLine();
        }

        /// <summary>
        /// Отступ, которым строка центрируется по ширине окна.
        ///
        /// Ширину берём у консоли, а не из константы: в узком окне надпись иначе
        /// переносится и рассыпается на две строки.
        /// </summary>
        private static int Centering(int lineLength)
        {
            var width = 0;

            try
            {
                // Выводу, ушедшему в файл или в конвейер, окно недоступно вовсе.
                width = Console.WindowWidth;
            }
            catch (IOException)
            {
                width = 0;
            }

            if (width <= 0)
                width = FallbackConsoleWidth;

            return width > lineLength ? (width - lineLength) / 2 : 0;
        }
    }
}
