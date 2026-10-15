using System.Collections.Generic;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Utilities;

namespace WaaaHa__patcher.API.Application
{
    /// <summary>
    /// Наборы хоткеев игрока: встроенные файлы игры и созданные им сами.
    /// </summary>
    public interface IHotkeySetService
    {
        IReadOnlyList<HotkeySetSummary> List(string profileName);

        HotkeySetDetails Get(string profileName, string fileName);

        HotkeySetDetails Create(string profileName, CreateHotkeySetRequest request);

        HotkeySetDetails Save(string profileName, string fileName, SaveHotkeySetRequest request);

        void Delete(string profileName, string fileName);

        /// <summary>Открыть набор средствами системы: файл или папку профиля.</summary>
        void Reveal(string profileName, string fileName, ShellRevealTarget target);
    }
}