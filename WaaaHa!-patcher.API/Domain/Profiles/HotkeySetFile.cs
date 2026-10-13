namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Краткая карточка набора хоткеев, лежащего в папке профиля.
    /// </summary>
    /// <param name="FileName">Имя файла, например <c>MY_SET.lua</c>.</param>
    /// <param name="DisplayName">Значение <c>bindings_locstring</c> — имя, которое видит игрок.</param>
    /// <param name="Version">Версия формата файла.</param>
    /// <param name="IsBuiltIn">Признак оригинального файла игры. Такие файлы нельзя менять.</param>
    /// <param name="BindingCount">Сколько всего хоткеев в наборе.</param>
    /// <param name="ModifiedAtUtc">Когда файл последний раз меняли.</param>
    public sealed record HotkeySetDescriptor(
        string FileName,
        string DisplayName,
        string Version,
        bool IsBuiltIn,
        int BindingCount,
        DateTime? ModifiedAtUtc);

    /// <summary>
    /// Файл набора хоткеев вместе с разобранным содержимым.
    /// </summary>
    public sealed record HotkeySetFile(
        string FileName,
        string FullPath,
        bool IsBuiltIn,
        Hotkeys.LuaBindingsDocument Document);
}