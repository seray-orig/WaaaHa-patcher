using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Domain.Profiles;
using WaaaHa__patcher.API.Utilities;

namespace WaaaHa__patcher.API.Application
{
    /// <inheritdoc />
    public sealed class HotkeySetService : IHotkeySetService
    {
        /// <summary>Ограничения имени набора, которые задаёт формат поля <c>bindings_locstring</c>.</summary>
        private const int MaxDisplayNameLength = 64;

        private const int MaxFileNameLength = 48;

        private readonly IProfileRepository _profiles;
        private readonly IHotkeySetRepository _sets;
        private readonly IHotkeyGroupResolver _groups;
        private readonly IHotkeyCategoryResolver _categories;
        private readonly IBindingValueValidator _validator;
        private readonly IShellLauncher _shell;

        public HotkeySetService(
            IProfileRepository profiles,
            IHotkeySetRepository sets,
            IHotkeyGroupResolver groups,
            IHotkeyCategoryResolver categories,
            IBindingValueValidator validator,
            IShellLauncher shell)
        {
            _profiles = profiles;
            _sets = sets;
            _groups = groups;
            _categories = categories;
            _validator = validator;
            _shell = shell;
        }

        public IReadOnlyList<HotkeySetSummary> List(string profileName)
        {
            RequireProfile(profileName);

            return _sets.List(profileName)
                .Select(descriptor => new HotkeySetSummary(
                    descriptor.FileName,
                    descriptor.DisplayName,
                    descriptor.Version,
                    descriptor.IsBuiltIn,
                    descriptor.BindingCount,
                    descriptor.ModifiedAtUtc))
                .ToList();
        }

        public HotkeySetDetails Get(string profileName, string fileName)
        {
            RequireProfile(profileName);
            var set = ReadOrThrow(profileName, fileName);

            return Describe(set);
        }

        public HotkeySetDetails Create(string profileName, CreateHotkeySetRequest request)
        {
            RequireProfile(profileName);

            var fileName = NormalizeFileName(request.FileName);
            var displayName = NormalizeDisplayName(request.DisplayName);

            if (_sets.IsEditableFileName(fileName) is false)
                throw new HotkeyException(
                    HotkeyErrorCode.FileNameReserved,
                    $"Имя «{fileName}» зарезервировано игрой.");

            if (File.Exists(Path.Combine(_profiles.Get(profileName)!.Directory, fileName)))
                throw new HotkeyException(
                    HotkeyErrorCode.FileNameTaken,
                    $"Файл «{fileName}» уже существует.");

            var baseSet = ReadOrThrow(profileName, request.BaseFileName);

            if (baseSet.Document.MainTable is null)
                throw new HotkeyException(
                    HotkeyErrorCode.BaseNotFound,
                    $"Файл «{request.BaseFileName}» не содержит таблицы bindings.");

            var document = LuaBindingsDocument.CopyOf(baseSet.Document, displayName);

            _sets.Write(profileName, fileName, document);

            return Describe(new HotkeySetFile(fileName, fileName, false, document));
        }

        public HotkeySetDetails Save(string profileName, string fileName, SaveHotkeySetRequest request)
        {
            RequireProfile(profileName);

            var set = ReadOrThrow(profileName, fileName);

            if (set.IsBuiltIn)
                throw new HotkeyException(
                    HotkeyErrorCode.ReadOnly,
                    $"Файл «{fileName}» — оригинальный файл игры. Создайте свой набор на его основе.");

            var displayName = NormalizeDisplayName(request.DisplayName);

            if (set.Document.MainTable is null)
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Файл «{fileName}» не содержит таблицы bindings.");

            foreach (var (id, rawValue) in request.Bindings)
            {
                var binding = FindBinding(set.Document, id)
                              ?? throw new HotkeyException(
                                  HotkeyErrorCode.UnknownBinding,
                                  $"Неизвестный хоткей «{id}».",
                                  id);

                var value = _validator.Normalize(rawValue)
                            ?? throw new HotkeyException(
                                HotkeyErrorCode.InvalidBindingValue,
                                $"Игра не распознаёт комбинацию для «{id}».",
                                rawValue);

                binding.Value = value;
            }

            set.Document.DisplayName = displayName;
            set.Document.Version = LuaBindingsDocument.SupportedVersion;

            _sets.Write(profileName, fileName, set.Document);

            return Describe(set);
        }

        public void Delete(string profileName, string fileName)
        {
            RequireProfile(profileName);

            var set = ReadOrThrow(profileName, fileName);

            if (set.IsBuiltIn)
                throw new HotkeyException(
                    HotkeyErrorCode.ReadOnly,
                    $"Файл «{fileName}» — оригинальный файл игры. Его нельзя удалить.");

            _sets.Delete(profileName, fileName);
        }

        /// <summary>
        /// Показывает файл набора средствами системы: открыть его связанной
        /// программой или показать папку профиля с выделенным файлом.
        ///
        /// Файл при этом не читается — достаточно знать, где он лежит.
        /// </summary>
        public void Reveal(string profileName, string fileName, ShellRevealTarget target)
        {
            RequireProfile(profileName);

            if (!HotkeySetRepository.IsValidFileName(fileName))
                throw new HotkeyException(
                    HotkeyErrorCode.FileNameInvalid,
                    $"Недопустимое имя файла: «{fileName}».",
                    fileName);

            var path = _sets.ResolvePath(profileName, fileName);

            if (!File.Exists(path))
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Файл «{fileName}» не найден в профиле «{profileName}».",
                    fileName);

            try
            {
                if (target == ShellRevealTarget.Folder)
                    _shell.RevealInFolder(path);
                else
                    _shell.OpenFile(path);
            }
            catch (IOException exception)
            {
                throw new HotkeyException(
                    HotkeyErrorCode.ShellFailed,
                    exception.Message,
                    fileName);
            }
        }

        private void RequireProfile(string profileName)
        {
            if (_profiles.Get(profileName) is null)
                throw new HotkeyException(
                    HotkeyErrorCode.ProfileNotFound,
                    $"Профиль «{profileName}» не найден.",
                    profileName);
        }

        private HotkeySetFile ReadOrThrow(string profileName, string fileName)
        {
            try
            {
                return _sets.Read(profileName, fileName);
            }
            catch (FileNotFoundException)
            {
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Файл «{fileName}» не найден в профиле «{profileName}».",
                    fileName);
            }
            catch (DirectoryNotFoundException)
            {
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Файл «{fileName}» не найден в профиле «{profileName}».",
                    fileName);
            }
            catch (IOException exception)
            {
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Не удалось прочитать «{fileName}»: {exception.Message}",
                    fileName);
            }
            catch (UnauthorizedAccessException exception)
            {
                throw new HotkeyException(
                    HotkeyErrorCode.SetNotFound,
                    $"Нет доступа к файлу «{fileName}»: {exception.Message}",
                    fileName);
            }
        }

        private HotkeySetDetails Describe(HotkeySetFile set)
            => new(
                set.FileName,
                set.Document.DisplayName,
                set.Document.Version,
                set.IsBuiltIn,
                BuildSections(set.Document));

        /// <summary>
        /// Хоткей ищется во всех таблицах: кроме основной есть camera_bindings,
        /// где формат значения другой, но править её тоже нужно.
        /// </summary>
        private static LuaBinding? FindBinding(LuaBindingsDocument document, string id)
            => document.Tables
                .Select(table => table.Find(id))
                .FirstOrDefault(binding => binding is not null);

        private IReadOnlyList<HotkeySection> BuildSections(LuaBindingsDocument document)
        {
            var sections = new List<HotkeySection>();
            var entries = new List<HotkeyEntry>();
            var title = string.Empty;
            var category = HotkeyCategory.System;

            void Flush()
            {
                if (entries.Count > 0)
                    sections.Add(new HotkeySection(title, entries.ToList()));

                entries.Clear();
            }

            foreach (var table in document.Tables)
            {
                foreach (var item in table.Items)
                {
                    switch (item)
                    {
                        case LuaBinding binding:
                            entries.Add(new HotkeyEntry(
                                binding.Id,
                                binding.Value,
                                _groups.Resolve(binding.Id),
                                ResolveCategory(binding.Id, category),
                                IconUrl(binding.Id)));
                            break;

                        case LuaRawLine raw when IsSectionTitle(raw.Text):
                            Flush();
                            title = ExtractTitle(raw.Text);

                            // Подразделы вроде «HQ» или «BARRACKS» ничего не сообщают
                            // о содержимом, поэтому наследуют раздел родителя.
                            var resolved = _categories.Resolve(title);

                            if (resolved != HotkeyCategory.System)
                                category = resolved;

                            break;
                    }
                }
            }

            Flush();

            return sections;
        }

        /// <summary>
        /// Базовый путь к картинке без расширения: какой формат положит игрок, решает
        /// интерфейс, перебирая варианты.
        /// </summary>
        private static string IconUrl(string bindingId)
            => $"/hotkey-images/{bindingId.ToLowerInvariant()}";

        /// <summary>
        /// Раздел приходит из заголовка секции. Техника отдельно не выделяется: в файле
        /// её нет, она отличима только по составу войск, и это знание живёт в интерфейсе.
        /// </summary>
        private string ResolveCategory(string bindingId, HotkeyCategory fallback)
        {
            var group = _groups.Resolve(bindingId);

            if (group == HotkeyGroupResolver.Common || group == HotkeyGroupResolver.Camera)
                return nameof(HotkeyCategory.System);

            if (group == HotkeyGroupResolver.Addon)
                return nameof(HotkeyCategory.Addon);

            return fallback.ToString();
        }

        /// <summary>
        /// Заголовок секции — короткий комментарий капсом. Поясняющие комментарии обычной
        /// прописной буквой в разделители не превращаются.
        /// </summary>
        private static bool IsSectionTitle(string text)
        {
            var body = ExtractTitle(text);

            if (body.Length is < 2 or > 60)
                return false;

            var letters = body.Where(char.IsLetter).ToArray();
            if (letters.Length == 0)
                return false;

            return letters.Count(char.IsUpper) >= letters.Length * 0.6;
        }

        private static string ExtractTitle(string text)
        {
            var trimmed = text.Trim();

            if (!trimmed.StartsWith("--", StringComparison.Ordinal))
                return trimmed;

            var body = trimmed[2..].Trim();

            return body.Length == 0 ? trimmed : body;
        }

        private static string NormalizeFileName(string? fileName)
        {
            var trimmed = (fileName ?? string.Empty).Trim();

            if (trimmed.Length == 0)
                throw new HotkeyException(HotkeyErrorCode.FileNameInvalid, "Имя файла не может быть пустым.");

            if (trimmed.Contains("..", StringComparison.Ordinal)
                || trimmed.IndexOfAny([Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar]) >= 0)
                throw new HotkeyException(
                    HotkeyErrorCode.FileNameInvalid,
                    "Имя файла не должно содержать путь или «..».");

            if (!trimmed.EndsWith(".lua", StringComparison.OrdinalIgnoreCase))
                trimmed += ".lua";

            trimmed = WindowsFileName.Sanitize(trimmed).ToUpperInvariant();

            if (trimmed.Length > MaxFileNameLength || trimmed == ".LUA" || !HotkeySetRepository.IsValidFileName(trimmed))
                throw new HotkeyException(
                    HotkeyErrorCode.FileNameInvalid,
                    $"Имя «{fileName}» недопустимо. Используйте латиницу, цифры, «-» и «_».");

            return trimmed;
        }

        private static string NormalizeDisplayName(string? displayName)
        {
            var builder = new StringBuilder(displayName ?? string.Empty);

            for (var i = builder.Length - 1; i >= 0; i--)
            {
                if (char.IsControl(builder[i]))
                    builder.Remove(i, 1);
            }

            var trimmed = builder.ToString().Trim().Replace('"', '\'');

            if (trimmed.Length == 0)
                throw new HotkeyException(
                    HotkeyErrorCode.DisplayNameInvalid,
                    "Имя набора не может быть пустым.");

            if (trimmed.Length > MaxDisplayNameLength)
                trimmed = trimmed[..MaxDisplayNameLength];

            return trimmed;
        }
    }
}