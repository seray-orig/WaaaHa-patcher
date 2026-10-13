namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Категория клавиши. Используется фронтендом для группировки клавиатуры при захвате ввода.
    /// </summary>
    public enum KeyCategory
    {
        Letter,
        Digit,
        Function,
        Navigation,
        Editing,
        Modifier,
        Numpad,
        MouseButton,
        ScreenEdge,
        System
    }
}