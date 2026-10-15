namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Разобранный файл биндингов Dawn of War.
    /// </summary>
    public sealed class LuaBindingsDocument
    {
        /// <summary>Версия формата, которую принимает текущая версия игры.</summary>
        public const string SupportedVersion = "15.2";

        /// <summary>Имя файла, в котором игра ищет список доступных наборов.</summary>
        public const string BindingsLocStringField = "bindings_locstring";

        public const string BindingsVersionField = "bindings_version";

        /// <summary>
        /// Имя поля в комментарии шапки, которым набор помнит основу.
        ///
        /// Хранится именно имя, без расширения и без пути: приложению достаточно
        /// знать, в каком файле хоткеев искать значение, а сам файл игрок в любой
        /// момент может переименовать или удалить — тогда сброс просто ничего не
        /// сделает.
        /// </summary>
        public const string BasedOnComment = "based_on";

        /// <summary>Таблица с основными биндингами.</summary>
        public const string MainTableName = "bindings";

        /// <summary>Таблица с биндингами камеры (формат последовательностей через запятую).</summary>
        public const string CameraTableName = "camera_bindings";

        /// <summary>Таблицы файла в исходном порядке.</summary>
        public List<LuaTable> Tables { get; } = [];

        public string Version { get; set; } = SupportedVersion;

        /// <summary>Значение поля <c>bindings_locstring</c> — имя набора, которое увидит игрок.</summary>
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Имя файла хоткеев, из которого набор вырос, без расширения и пути.
        ///
        /// Записывается комментарием в шапку, а не отдельным полем: лишнее поле игра
        /// читать не станет, зато пометку видно глазами, если открыть файл текстовым
        /// редактором.
        ///
        /// Пустая строка — основу не знаем. Стандартных значений тогда нет, и сброс
        /// по цифре 0 ничего не меняет.
        /// </summary>
        public string BaseName { get; set; } = string.Empty;

        public LuaTable? MainTable => Tables.Find(table => table.Name == MainTableName);

        public LuaTable? CameraTable => Tables.Find(table => table.Name == CameraTableName);

        /// <summary>
        /// Создаёт новый набор на основе существующего файла: сохраняет порядок биндингов
        /// и комментарии-разделители секций, но обнуляет значения.
        /// </summary>
        /// <remarks>
        /// Обнуляется только таблица <c>bindings</c>. Всё остальное (сейчас это
        /// <c>camera_bindings</c> с её особым форматом последовательностей) переносится
        /// как есть, иначе набор останется без управления камерой, а редактировать её
        /// в интерфейсе нельзя.
        /// </remarks>
        public static LuaBindingsDocument FromTemplate(LuaBindingsDocument template, string displayName)
        {
            var document = new LuaBindingsDocument
            {
                DisplayName = displayName,
                Version = SupportedVersion
            };

            foreach (var table in template.Tables)
            {
                var keepValues = !string.Equals(table.Name, MainTableName, StringComparison.Ordinal);
                var copy = new LuaTable(table.Name);

                foreach (var item in table.Items)
                {
                    copy.Items.Add(item is LuaBinding binding
                        ? new LuaBinding(binding.Id, keepValues ? binding.Value : string.Empty)
                            {
                                Indent = binding.Indent,
                                Suffix = binding.Suffix,
                                TrailingComment = binding.TrailingComment
                            }
                        : item);
                }

                document.Tables.Add(copy);
            }

            return document;
        }

        /// <summary>
        /// Создаёт новый набор, который начинается с настроек основы. Так игрок сразу
        /// видит рабочий набор и меняет только то, что хочет.
        /// </summary>
        public static LuaBindingsDocument CopyOf(LuaBindingsDocument template, string displayName)
        {
            var document = FromTemplate(template, displayName);
            var original = template.MainTable;
            var target = document.MainTable;

            if (original is null || target is null)
                return document;

            foreach (var binding in target.Bindings)
                binding.Value = original.Find(binding.Id)?.Value ?? string.Empty;

            return document;
        }
    }
}