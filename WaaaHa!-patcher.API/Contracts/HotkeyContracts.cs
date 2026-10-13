using System;
using System.Collections.Generic;

namespace WaaaHa__patcher.API.Contracts
{
    /// <summary>
    /// Карточка набора хоткеев в профиле.
    /// </summary>
    public sealed record HotkeySetSummary(
        string FileName,
        string DisplayName,
        string Version,
        bool IsBuiltIn,
        int BindingCount,
        DateTime? ModifiedAtUtc);

    /// <summary>
    /// Один редактируемый хоткей.
    /// </summary>
    /// <param name="Id">Идентификатор команды в игре, например <c>marine_servitor</c>.</param>
    /// <param name="Value">Значение в формате Lua: <c>Control+Shift+A</c> или пустая строка.</param>
    /// <param name="Group">Логическая группа по префиксу идентификатора: <c>marine</c>, <c>chaos</c> и так далее.</param>
    /// <param name="IconUrl">Путь к картинке-иконке. Может указывать на несуществующий файл — интерфейс подставит заглушку.</param>
    public sealed record HotkeyEntry(string Id, string Value, string Group, string IconUrl);

    /// <summary>
    /// Секция набора, восстановленная по комментариям исходного файла.
    /// </summary>
    public sealed record HotkeySection(string Title, IReadOnlyList<HotkeyEntry> Entries);

    /// <summary>
    /// Полное содержимое набора, готовое к редактированию.
    /// </summary>
    public sealed record HotkeySetDetails(
        string FileName,
        string DisplayName,
        string Version,
        bool IsBuiltIn,
        IReadOnlyList<HotkeySection> Sections);

    /// <summary>
    /// Клавиша, доступная для назначения.
    /// </summary>
    public sealed record KeyInfo(string Name, string Category, bool IsModifier);

    /// <summary>
    /// Каталог всех клавиш, которые понимает игра.
    /// </summary>
    public sealed record KeyCatalog(IReadOnlyList<KeyInfo> Keys);

    /// <summary>
    /// Запрос на создание нового набора на основе одного из встроенных.
    /// </summary>
    /// <param name="FileName">Имя нового файла, например <c>MY_SET.lua</c>.</param>
    /// <param name="DisplayName">Имя набора, которое увидит игрок в списке хоткеев.</param>
    /// <param name="BaseFileName">Файл-основа, из которого берётся структура команд.</param>
    public sealed record CreateHotkeySetRequest(string FileName, string DisplayName, string BaseFileName);

    /// <summary>
    /// Запрос на сохранение набора.
    /// </summary>
    /// <param name="DisplayName">Имя набора, которое увидит игрок.</param>
    /// <param name="Bindings">Новые значения хоткеев в виде «идентификатор → комбинация».</param>
    public sealed record SaveHotkeySetRequest(string DisplayName, IReadOnlyDictionary<string, string> Bindings);
}