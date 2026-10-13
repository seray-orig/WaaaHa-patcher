namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Элемент тела таблицы. Либо биндинг, либо строка, которую нужно сохранить как есть:
    /// комментарий-разделитель секции, пустая строка или линейка из дефисов.
    /// </summary>
    public abstract class LuaTableItem
    {
    }

    /// <summary>
    /// Строка, которая не является биндингом. Сохраняется дословно, чтобы не потерять
    /// структуру и комментарии исходного файла.
    /// </summary>
    public sealed class LuaRawLine : LuaTableItem
    {
        public LuaRawLine(string text) => Text = text;

        public string Text { get; set; }
    }

    /// <summary>
    /// Запись вида <c>marine_servitor = "B",</c>.
    /// </summary>
    public sealed class LuaBinding : LuaTableItem
    {
        public const string DefaultIndent = "\t";
        public const string DefaultSuffix = ",";

        public LuaBinding(string id, string value)
        {
            Id = id;
            Value = value;
        }

        public string Id { get; set; }

        public string Value { get; set; }

        /// <summary>Отступ строки (в исходниках — таб).</summary>
        public string Indent { get; set; } = DefaultIndent;

        /// <summary>Запятая после значения.</summary>
        public string Suffix { get; set; } = DefaultSuffix;

        /// <summary>Хвостовой комментарий после запятой, например <c>-- tau commander trap</c>.</summary>
        public string TrailingComment { get; set; } = string.Empty;

        /// <summary>Имя файла-картинки для этого биндинга.</summary>
        public string IconId => Id;
    }

    /// <summary>
    /// Таблица верхнего уровня: <c>bindings = { ... }</c> либо <c>camera_bindings = { ... }</c>.
    /// </summary>
    public sealed class LuaTable
    {
        public LuaTable(string name, IReadOnlyList<LuaTableItem>? items = null)
        {
            Name = name;

            if (items is not null)
                Items.AddRange(items);
        }

        public string Name { get; set; }

        public List<LuaTableItem> Items { get; } = [];

        public IEnumerable<LuaBinding> Bindings => Items.OfType<LuaBinding>();

        public LuaBinding? Find(string id) => Bindings.FirstOrDefault(binding => binding.Id == id);
    }
}