using System;
using System.Collections.Generic;
using System.Linq;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Последовательность комбинаций через запятую — формат, который игра использует для камеры
    /// (<c>camera_panleft = "Left,Shift+A"</c>).
    /// </summary>
    public sealed class ChordSequence
    {
        public const char Separator = ',';

        private ChordSequence(IReadOnlyList<KeyChord> chords) => Chords = chords;

        public IReadOnlyList<KeyChord> Chords { get; }

        public bool IsEmpty => Chords.Count == 0 || Chords.All(chord => chord.IsEmpty);

        public static ChordSequence Empty { get; } = new([]);

        public static ChordSequence Single(KeyChord chord) => new([chord]);

        /// <summary>
        /// Разбирает значение поля файла. Пустая строка даёт пустую последовательность.
        /// </summary>
        public static bool TryParse(string? text, IKeyRegistry registry, out ChordSequence sequence, out string? invalidPart)
        {
            sequence = Empty;
            invalidPart = null;

            if (string.IsNullOrWhiteSpace(text))
                return true;

            var chords = new List<KeyChord>();

            foreach (var part in text.Split(Separator, StringSplitOptions.TrimEntries))
            {
                if (part.Length == 0 || !KeyChord.TryParse(part, registry, out var chord) || chord.IsEmpty)
                {
                    invalidPart = part;
                    return false;
                }

                chords.Add(chord);
            }

            sequence = chords.Count == 0 ? Empty : new ChordSequence(chords);
            return true;
        }

        /// <summary>
        /// Возвращает значение в каноническом виде, пригодном для записи в файл.
        /// </summary>
        public string Compose() => string.Join(Separator, Chords.Select(chord => chord.Compose()));

        public override string ToString() => Compose();
    }
}