using System.Collections.Generic;
using WaaaHa__patcher.API.Domain.Hotkeys;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Хранилище наборов хоткеев внутри папки профиля.
    /// </summary>
    public interface IHotkeySetRepository
    {
        /// <summary>Все файлы хоткеев профиля: сначала встроенные, потом пользовательские.</summary>
        IReadOnlyList<HotkeySetDescriptor> List(string profileName);

        HotkeySetFile Read(string profileName, string fileName);

        void Write(string profileName, string fileName, LuaBindingsDocument document);

        void Delete(string profileName, string fileName);

        /// <summary>Проверяет, что имя файла безопасное и не принадлежит игре.</summary>
        bool IsEditableFileName(string fileName);
    }
}