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

        /// <summary>Таблица с основными биндингами.</summary>
        public const string MainTableName = "bindings";

        /// <summary>Таблица с биндингами камеры (формат последовательностей через запятую).</summary>
        public const string CameraTableName = "camera_bindings";

        /// <summary>Таблицы файла в исходном порядке.</summary>
        public List<LuaTable> Tables { get; } = [];

        public string Version { get; set; } = SupportedVersion;

        /// <summary>Значение поля <c>bindings_locstring</c> — имя набора, которое увидит игрок.</summary>
        public string DisplayName { get; set; } = string.Empty;

        public LuaTable? MainTable => Tables.Find(table => table.Name == MainTableName);

        public LuaTable? CameraTable => Tables.Find(table => table.Name == CameraTableName);

        /// <summary>
        /// Создаёт пустой документ на основе структуры исходного файла: сохраняет порядок
        /// биндингов, комментарии-разделители и таблицу камеры, но обнуляет значения.
        /// </summary>
        public static LuaBindingsDocument FromTemplate(LuaBindingsDocument template, string displayName)
        {
            var document = new LuaBindingsDocument
            {
                DisplayName = displayName,
                Version = SupportedVersion
            };

            foreach (var table in template.Tables)
            {
                var copy = new LuaTable(table.Name);

                foreach (var item in table.Items)
                    copy.Items.Add(item is LuaBinding binding ? new LuaBinding(binding.Id, string.Empty) : item);

                document.Tables.Add(copy);
            }

            return document;
        }
    }
}