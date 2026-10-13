namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <inheritdoc />
    public sealed class BindingValueValidator : IBindingValueValidator
    {
        private readonly IKeyRegistry _registry;

        public BindingValueValidator(IKeyRegistry registry) => _registry = registry;

        public BindingValueResult Validate(string? value)
        {
            return ChordSequence.TryParse(value, _registry, out var sequence, out var invalidPart)
                ? BindingValueResult.Valid(sequence)
                : BindingValueResult.Invalid(invalidPart ?? value ?? string.Empty);
        }

        public string? Normalize(string? value)
        {
            var result = Validate(value);
            return result.IsValid ? result.Sequence!.Compose() : null;
        }
    }
}