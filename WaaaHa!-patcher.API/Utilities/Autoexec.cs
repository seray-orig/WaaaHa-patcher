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
                    Process.Start(new ProcessStartInfo(url+"/api/hotkeys/UpdateProfiles") { UseShellExecute = true });
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
            catch { }
        }

        private static void PrintUrl(string url)
        {
            Console.WriteLine();
            Console.WriteLine();

            var previousColor1 = Console.ForegroundColor;
            var previousColor2 = Console.BackgroundColor;

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.BackgroundColor = ConsoleColor.DarkYellow;

            var mess = " OPEN IN BROWSER:";
            Console.SetCursorPosition(Console.WindowWidth / 2 - (mess.Length + url.Length) / 2, Console.CursorTop);
            Console.Write(mess);

            Console.ForegroundColor = ConsoleColor.Black;
            Console.BackgroundColor = ConsoleColor.White;

            Console.WriteLine(" " + url + " ");

            Console.ForegroundColor = previousColor1;
            Console.BackgroundColor = previousColor2;

            Console.WriteLine();
        }
    }
}
