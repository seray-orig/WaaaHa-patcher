namespace WaaaHa__patcher.API.Application
{
    /// <summary>
    /// Причина отказа. Интерфейс показывает локализованный текст по коду, поэтому
    /// сообщение сервера остаётся машинно-читаемым.
    /// </summary>
    public enum HotkeyErrorCode
    {
        Unknown,
        GameFolderNotFound,
        ProfileNotFound,
        SetNotFound,
        BaseNotFound,
        FileNameInvalid,
        FileNameTaken,
        FileNameReserved,
        DisplayNameInvalid,
        ReadOnly,
        InvalidBindingValue,
        UnknownBinding,
        ShellFailed
    }

    /// <summary>
    /// Ошибка предметной области. Контроллер превращает её в HTTP-ответ без потери кода.
    /// </summary>
    public sealed class HotkeyException : Exception
    {
        public HotkeyException(HotkeyErrorCode code, string message, string? detail = null)
            : base(message)
        {
            Code = code;
            Detail = detail;
        }

        public HotkeyErrorCode Code { get; }

        /// <summary>Дополнительные данные, например нераспознанный фрагмент комбинации.</summary>
        public string? Detail { get; }
    }
}