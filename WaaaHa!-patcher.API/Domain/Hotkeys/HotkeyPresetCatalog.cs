using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Готовый набор, который приложение везёт с собой.
    /// </summary>
    public interface IHotkeyPresetCatalog
    {
        /// <summary>
        /// Имя основы, по которому набор выбирают при создании. Специальное слово
        /// вместо имени файла: такого файла в профиле быть не может, и отдельная
        /// проверка в сервисе не нужна.
        /// </summary>
        const string MultiplayerBaseName = "@multiplayer";

        /// <summary>Пресет для сетевой игры: без команд из кампаний и с блоком камеры.</summary>
        HotkeyPresetSummary Multiplayer { get; }

        /// <summary>Разобранное содержимое пресета.</summary>
        LuaBindingsDocument LoadDocument();

        /// <summary>
        /// Есть ли хоткей в пресете. Этим же ответом решается, что считать
        /// мусором: во что не входит сетевой набор, то из файла игры убирается.
        /// </summary>
        bool Contains(string bindingId);
    }

    /// <summary>Краткая карточка пресета для выбора основы.</summary>
    public sealed record HotkeyPresetSummary(string FileName, string DisplayName, string Version, int BindingCount);

    /// <summary>
    /// Пресеты лежат внутри сборки: приложение однофайловое, и файла рядом с ним
    /// может не оказаться.
    /// </summary>
    public sealed class HotkeyPresetCatalog : IHotkeyPresetCatalog
    {
        private const string ResourceName = "WaaaHa__patcher.API.Presets.MULTIPLAYER.LUA";

        private readonly ILuaBindingsParser _parser;
        private readonly Lazy<LuaBindingsDocument> _document;

        public HotkeyPresetCatalog(ILuaBindingsParser parser)
        {
            _parser = parser;
            _document = new Lazy<LuaBindingsDocument>(Load, LazyThreadSafetyMode.ExecutionAndPublication);
        }

        public HotkeyPresetSummary Multiplayer
        {
            get
            {
                var document = _document.Value;
                var main = document.MainTable;

                if (document.CameraTable is null)
                {
                    throw new InvalidOperationException(
                        "Пресет собран без camera_bindings: без него игра не читает файл.");
                }

                return new HotkeyPresetSummary(
                    IHotkeyPresetCatalog.MultiplayerBaseName,
                    "Multiplayer",
                    document.Version,
                    main?.Bindings.Count() ?? 0);
            }
        }

        public LuaBindingsDocument LoadDocument() => _document.Value;

        public bool Contains(string bindingId)
            => _document.Value.Tables.Any(table => table.Find(bindingId) is not null);

        private LuaBindingsDocument Load()
        {
            using var stream = typeof(HotkeyPresetCatalog).GetTypeInfo().Assembly
                .GetManifestResourceStream(ResourceName)
                ?? throw new InvalidOperationException($"Пресет не найден внутри сборки: {ResourceName}.");

            using var reader = new StreamReader(stream);
            var text = reader.ReadToEnd();

            return _parser.Parse(text.Split('\n'));
        }
    }
}