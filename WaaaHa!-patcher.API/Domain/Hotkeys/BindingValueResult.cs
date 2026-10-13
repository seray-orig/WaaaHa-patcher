namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Результат проверки строки, записанной в поле биндинга.
    /// </summary>
    /// <param name="IsValid">Пустая строка тоже валидна — это «хоткей не назначен».</param>
    /// <param name="Sequence">Разобранная последовательность комбинаций.</param>
    /// <param name="InvalidPart">Фрагмент, который игра не распознала.</param>
    public sealed record BindingValueResult(bool IsValid, ChordSequence? Sequence, string? InvalidPart)
    {
        public static BindingValueResult Valid(ChordSequence sequence) => new(true, sequence, null);

        public static BindingValueResult Invalid(string part) => new(false, null, part);
    }
}