namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Описание одной клавиши, допустимой в файлах биндингов Dawn of War.
    /// </summary>
    /// <param name="Name">Имя в формате Lua-файла, например <c>NumpadPlus</c>.</param>
    /// <param name="Category">Категория для группировки в интерфейсе.</param>
    public sealed record KeyDefinition(string Name, KeyCategory Category)
    {
        /// <summary>Модификатор можно использовать только в комбинации с обычной клавишей.</summary>
        public bool IsModifier => Category == KeyCategory.Modifier;
    }
}