namespace WaaaHa__patcher.API.Contracts
{
    /// <summary>
    /// Единый формат ошибки. Интерфейс ориентируется на <see cref="Code"/> и показывает
    /// локализованный текст, а <see cref="Title"/> служит запасным вариантом.
    /// </summary>
    public sealed record ApiError(string Code, string Title, string? Detail = null)
    {
        public static ApiError FromCode(string code, string title) => new(code, title);
    }
}