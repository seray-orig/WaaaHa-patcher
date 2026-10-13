using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Реестр клавиш, собранный ровно по списку «Valid keys» из заголовка KEYDEFAULTS*.LUA.
    /// </summary>
    public sealed class KeyRegistry : IKeyRegistry
    {
        public const string Control = "Control";
        public const string Shift = "Shift";
        public const string Alt = "Alt";

        private static readonly string[] ModifierNames = [Control, Shift, Alt];

        private readonly Dictionary<string, KeyDefinition> _byName;

        public KeyRegistry()
        {
            var definitions = new List<KeyDefinition>();

            void AddRange(IEnumerable<string> names, KeyCategory category)
                => definitions.AddRange(names.Select(name => new KeyDefinition(name, category)));

            AddRange(Enumerable.Range('A', 'Z' - 'A' + 1).Select(i => ((char)i).ToString()), KeyCategory.Letter);
            AddRange(Enumerable.Range('0', 10).Select(i => ((char)i).ToString()), KeyCategory.Digit);
            AddRange(Enumerable.Range(1, 12).Select(i => $"F{i}"), KeyCategory.Function);

            AddRange(
                ["Backspace", "Tab", "Enter", "Escape", "Space", "Insert", "Delete", "Pause", "PrintScreen"],
                KeyCategory.Editing);

            AddRange(
                ["Up", "Down", "Left", "Right", "Home", "End", "PageUp", "PageDown"],
                KeyCategory.Navigation);

            AddRange(
                ["Apostrophe", "Comma", "Minus", "Period", "Slash", "Semicolon", "Equal",
                 "LBracket", "Backslash", "RBracket", "Grave"],
                KeyCategory.Letter);

            AddRange(ModifierNames, KeyCategory.Modifier);

            AddRange(["CapsLock", "NumLock", "ScrollLock"], KeyCategory.System);

            AddRange(
                ["MouseLeft", "MouseRight", "MouseMiddle", "MouseTop", "MouseBottom"],
                KeyCategory.MouseButton);

            AddRange(["ScreenLeft", "ScreenRight", "ScreenTop", "ScreenBottom"], KeyCategory.ScreenEdge);

            AddRange(Enumerable.Range(0, 10).Select(i => $"Numpad{i}"), KeyCategory.Numpad);
            AddRange(
                ["NumpadMultiply", "NumpadPlus", "NumpadSeparator", "NumpadMinus", "NumpadPeriod", "NumpadSlash"],
                KeyCategory.Numpad);

            Keys = new ReadOnlyCollection<KeyDefinition>(definitions);
            Modifiers = new ReadOnlyCollection<KeyDefinition>(
                definitions.Where(d => d.IsModifier).ToList());

            _byName = definitions.ToDictionary(d => d.Name, StringComparer.Ordinal);
        }

        public IReadOnlyList<KeyDefinition> Keys { get; }

        public IReadOnlyList<KeyDefinition> Modifiers { get; }

        public bool IsKnown(string name) => !string.IsNullOrEmpty(name) && _byName.ContainsKey(name);
    }
}