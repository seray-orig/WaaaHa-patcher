using System;
using System.Linq;
using System.Text;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Комбинация клавиш в формате файла биндингов: <c>Control+Shift+A</c>.
    /// Пустая строка в файле означает «не назначено».
    /// </summary>
    /// <param name="Key">Основная клавиша. Пустая строка — хоткей не назначен.</param>
    /// <param name="Modifiers">Нажатые модификаторы.</param>
    public sealed record KeyChord(string Key, ChordModifiers Modifiers)
    {
        /// <summary>Хоткей не назначен.</summary>
        public static KeyChord Empty { get; } = new(string.Empty, ChordModifiers.None);

        /// <summary>Пустая строка — хоткей не назначен.</summary>
        public bool IsEmpty => string.IsNullOrEmpty(Key);

        /// <summary>
        /// Разбирает одиночную комбинацию. Регистр не важен: «c» и «C» — одна и та же клавиша.
        /// </summary>
        public static bool TryParse(string? text, IKeyRegistry registry, out KeyChord chord)
        {
            chord = Empty;

            if (string.IsNullOrWhiteSpace(text))
                return true;

            // Пустые части не отбрасываем: «Control+» — это опечатка, а не «Control».
            var parts = text.Split('+');
            if (parts.Length == 0 || parts.Any(string.IsNullOrWhiteSpace))
                return false;

            var modifiers = ChordModifiers.None;
            string? key = null;

            foreach (var rawPart in parts)
            {
                var part = Canonical(rawPart);

                if (IsModifier(part, out var modifier))
                {
                    if ((modifiers & modifier) != 0)
                        return false;

                    modifiers |= modifier;
                    continue;
                }

                if (key is not null || !registry.IsKnown(part))
                    return false;

                key = part;
            }

            // Игра допускает «голый» модификатор как самостоятельный хоткей:
            // camera_rotate = "Alt", commandqueue = "Shift". Записываем его как клавишу
            // без модификаторов, иначе Compose вернул бы "Alt+Alt".
            if (key is null)
            {
                if (modifiers == ChordModifiers.None)
                    return false;

                var only = modifiers switch
                {
                    ChordModifiers.Control => KeyRegistry.Control,
                    ChordModifiers.Shift => KeyRegistry.Shift,
                    ChordModifiers.Alt => KeyRegistry.Alt,
                    _ => null
                };

                if (only is null)
                    return false;

                chord = new KeyChord(only, ChordModifiers.None);
                return true;
            }

            chord = new KeyChord(key, modifiers);
            return true;
        }

        /// <summary>
        /// Приводит любой ввод к каноническому виду: правильный регистр, порядок модификаторов.
        /// </summary>
        public string Compose()
        {
            if (IsEmpty)
                return string.Empty;

            var builder = new StringBuilder();

            AppendModifier(builder, ChordModifiers.Control, KeyRegistry.Control);
            AppendModifier(builder, ChordModifiers.Shift, KeyRegistry.Shift);
            AppendModifier(builder, ChordModifiers.Alt, KeyRegistry.Alt);

            builder.Append(Key);

            return builder.ToString();

            void AppendModifier(StringBuilder target, ChordModifiers flag, string name)
            {
                if ((Modifiers & flag) == flag)
                    target.Append(name).Append('+');
            }
        }

        public override string ToString() => Compose();

        private static bool IsModifier(string name, out ChordModifiers modifier)
        {
            switch (name)
            {
                case KeyRegistry.Control: modifier = ChordModifiers.Control; return true;
                case KeyRegistry.Shift: modifier = ChordModifiers.Shift; return true;
                case KeyRegistry.Alt: modifier = ChordModifiers.Alt; return true;
                default: modifier = ChordModifiers.None; return false;
            }
        }

        private static string Canonical(string name) => name.Length switch
        {
            1 => char.ToUpperInvariant(name[0]).ToString(),
            _ => char.ToUpperInvariant(name[0]) + name[1..]
        };
    }
}