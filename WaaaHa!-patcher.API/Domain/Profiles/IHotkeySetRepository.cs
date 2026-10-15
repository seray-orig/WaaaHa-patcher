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

        /// <summary>
        /// Полный путь к файлу набора. Единственное место, где имя склеивается с
        /// папкой профиля, поэтому и проверка имени живёт тут же.
        /// </summary>
        string ResolvePath(string profileName, string fileName);

        /// <summary>
        /// Файл набора по имени без расширения — так, как набор помнит свою основу.
        ///
        /// Возвращает <c>null</c>, если такого файла в профиле больше нет: игрок
        /// вправе переименовать или удалить основу, и это не повод ломать открытие
        /// набора — сброс к стандартному просто не сработает.
        /// </summary>
        string? FindByBaseName(string profileName, string baseName);
    }
}