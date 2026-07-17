using System.Diagnostics;

namespace WaaaHa__patcher.API.Utilities
{
    public static class Autoexec
    {
        public static void OpenUrl(string url)
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
            catch { }
        }

        public static void PrintUrl(string url)
        {
            Console.WriteLine();
            Console.WriteLine();

            var previousColor1 = Console.ForegroundColor;
            var previousColor2 = Console.BackgroundColor;

            Console.ForegroundColor = ConsoleColor.DarkYellow;
            Console.BackgroundColor = ConsoleColor.Yellow;

            var mess = " OPEN IN BROWSER: ";
            Console.SetCursorPosition(Console.WindowWidth / 2 - (mess.Length + url.Length) / 2, Console.CursorTop);
            Console.Write(mess);

            Console.ForegroundColor = ConsoleColor.Black;
            Console.BackgroundColor = ConsoleColor.White;

            Console.WriteLine(url);

            Console.ForegroundColor = previousColor1;
            Console.BackgroundColor = previousColor2;

            Console.WriteLine();
        }
    }
}
