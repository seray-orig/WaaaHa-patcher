namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Проверяет, что значение поля биндинга понимает игра, и нормализует его к каноническому виду.
    /// </summary>
    public interface IBindingValueValidator
    {
        BindingValueResult Validate(string? value);

        /// <summary>Приводит значение к каноническому виду или возвращает <c>null</c>, если значение недопустимо.</summary>
        string? Normalize(string? value);
    }
}