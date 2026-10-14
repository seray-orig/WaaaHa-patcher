using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using WaaaHa__patcher.API.Domain.Hotkeys;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <inheritdoc />
    public sealed partial class HotkeySetRepository : IHotkeySetRepository
    {
        /// <summary>Префикс оригинальных файлов игры. Всё, что начинается с него, неприкосновенно.</summary>
        private const string BuiltInPrefix = "KEYDEFAULTS";

        private readonly IProfileRepository _profiles;
        private readonly ILuaBindingsParser _parser;
        private readonly ILuaBindingsWriter _writer;

        public HotkeySetRepository(IProfileRepository profiles, ILuaBindingsParser parser, ILuaBindingsWriter writer)
        {
            _profiles = profiles;
            _parser = parser;
            _writer = writer;
        }

        public IReadOnlyList<HotkeySetDescriptor> List(string profileName)
        {
            var profile = _profiles.Get(profileName);

            if (profile is null)
                return [];

            var descriptors = new List<HotkeySetDescriptor>();

            // Файлы игры называются KEYDEFAULTS*.LUA, то есть с большой буквы. Маска
            // «*.lua» на Windows нечувствительна к регистру, а на Linux чувствительна,
            // и наборы игры там просто не находились — список выходил пустым. Поэтому
            // перебираем всё и расширение проверяем сами.
            foreach (var file in Directory.EnumerateFiles(profile.Directory))
            {
                var fileName = Path.GetFileName(file);

                if (!IsValidFileName(fileName))
                    continue;

                if (IsBuiltIn(fileName))
                {
                    descriptors.Add(ReadBuiltInDescriptor(file, fileName));
                    continue;
                }

                var custom = TryReadCustomDescriptor(file, fileName);
                if (custom is not null)
                    descriptors.Add(custom);
            }

            return descriptors
                .OrderByDescending(descriptor => descriptor.IsBuiltIn)
                .ThenBy(descriptor => descriptor.DisplayName, StringComparer.CurrentCultureIgnoreCase)
                .ToList();
        }

        public HotkeySetFile Read(string profileName, string fileName)
        {
            var fullPath = ResolvePath(profileName, fileName);
            var document = _parser.ParseFile(fullPath);

            return new HotkeySetFile(fileName, fullPath, IsBuiltIn(fileName), document);
        }

        public void Write(string profileName, string fileName, LuaBindingsDocument document)
        {
            if (IsBuiltIn(fileName))
                throw new InvalidOperationException($"Файл «{fileName}» принадлежит игре и не может быть изменён.");

            _writer.WriteFile(document, ResolvePath(profileName, fileName));
        }

        public void Delete(string profileName, string fileName)
        {
            var fullPath = ResolvePath(profileName, fileName);

            if (IsBuiltIn(fileName))
                throw new InvalidOperationException($"Файл «{fileName}» принадлежит игре и не может быть удалён.");

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }

        public bool IsEditableFileName(string fileName) => IsValidFileName(fileName) && !IsBuiltIn(fileName);

        /// <summary>Проверяет форму имени файла, не обращаясь к диску.</summary>
        public static bool IsValidFileName(string fileName)
            => WindowsFileName.IsValid(fileName)
               && Path.GetExtension(fileName).Equals(".lua", StringComparison.OrdinalIgnoreCase);

        private static bool IsBuiltIn(string fileName)
            => Path.GetFileNameWithoutExtension(fileName).StartsWith(BuiltInPrefix, StringComparison.OrdinalIgnoreCase);

        private HotkeySetDescriptor ReadBuiltInDescriptor(string fullPath, string fileName)
        {
            var document = _parser.ParseFile(fullPath);

            return new HotkeySetDescriptor(
                fileName,
                document.DisplayName,
                document.Version,
                true,
                document.MainTable?.Bindings.Count() ?? 0,
                SafeLastWriteTime(fullPath));
        }

        /// <summary>
        /// Пользовательский файл отличается наличием поля <c>bindings_version</c>.
        /// Такой признак надёжнее имени: он отсекает playercfg.lua и любые посторонние скрипты.
        /// </summary>
        private HotkeySetDescriptor? TryReadCustomDescriptor(string fullPath, string fileName)
        {
            try
            {
                var document = _parser.ParseFile(fullPath);

                if (document.MainTable is null)
                    return null;

                return new HotkeySetDescriptor(
                    fileName,
                    document.DisplayName,
                    document.Version,
                    false,
                    document.MainTable.Bindings.Count(),
                    SafeLastWriteTime(fullPath));
            }
            catch
            {
                // Битый или незаписываемый файл не должен ломать весь список.
                return null;
            }
        }

        private string ResolvePath(string profileName, string fileName)
        {
            if (!IsValidFileName(fileName))
                throw new ArgumentException($"Недопустимое имя файла: «{fileName}».", nameof(fileName));

            var profile = _profiles.Get(profileName)
                          ?? throw new ArgumentException($"Профиль «{profileName}» не найден.", nameof(profileName));

            return Path.Combine(profile.Directory, fileName);
        }

        private static DateTime? SafeLastWriteTime(string path)
        {
            try
            {
                return File.GetLastWriteTimeUtc(path);
            }
            catch
            {
                return null;
            }
        }
    }
}