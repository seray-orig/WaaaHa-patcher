using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;

namespace WaaaHa__patcher.API.Utilities
{
    /// <summary>
    /// Оболочка Windows. Игра запускается только на Windows, так что проверки
    /// платформы тут нет: она всплыла бы как FileNotFoundException уже при
    /// запуске приложения.
    /// </summary>
    public sealed class WindowsShellLauncher : IShellLauncher
    {
        public void OpenFile(string path)
        {
            // UseShellExecute — единственный способ отдать файл той программе,
            // которую игрок назначил для .lua. Без него запустится сам Process.
            Start(new ProcessStartInfo(path) { UseShellExecute = true }, path);
        }

        public void RevealInFolder(string path)
        {
            // Проводник не умеет «открыть и выделить» одной командой, только через
            // ключ /select. Сам путь передаётся аргументом, поэтому кавычки внутри
            // него недопустимы: имя файла проверяется на этапе разбора.
            Start(
                new ProcessStartInfo("explorer.exe")
                {
                    UseShellExecute = false,
                    ArgumentList = { "/select,", path },
                },
                path);
        }

        private static void Start(ProcessStartInfo startInfo, string path)
        {
            try
            {
                Process.Start(startInfo);
            }
            catch (Win32Exception exception)
            {
                // Типичный случай: для .lua не назначено ни одной программы.
                throw new IOException(
                    $"Windows не смогла открыть «{Path.GetFileName(path)}»: {exception.Message}",
                    exception);
            }
            catch (PlatformNotSupportedException exception)
            {
                throw new IOException("Открытие средствами системы поддерживается только в Windows.", exception);
            }
        }
    }
}