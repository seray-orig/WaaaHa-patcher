using System.Collections.Generic;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Utilities;

namespace WaaaHa__patcher.API.Application
{
    /// <summary>
    /// Сценарии работы с наборами хоткеев. Контроллеры остаются тонкими.
    /// </summary>
    public interface IHotkeySetService
    {
        IReadOnlyList<HotkeySetSummary> List(string profileName);

        HotkeySetDetails Get(string profileName, string fileName);

        HotkeySetDetails Create(string profileName, CreateHotkeySetRequest request);

        HotkeySetDetails Save(string profileName, string fileName, SaveHotkeySetRequest request);

        void Delete(string profileName, string fileName);

        /// <summary>Показать набор средствами операционной системы.</summary>
        void Reveal(string profileName, string fileName, ShellRevealTarget target);

        /// <summary>Пресеты, которые приложение везёт с собой: их выбирают основой набора.</summary>
        IReadOnlyList<HotkeyPresetSummary> ListPresets();
    }
}