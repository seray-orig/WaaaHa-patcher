using System.Collections.Generic;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Реестр клавиш, принимаемых игрой. Единственный источник истины о том, что можно записать в файл.
    /// </summary>
    public interface IKeyRegistry
    {
        /// <summary>Все допустимые клавиши.</summary>
        IReadOnlyList<KeyDefinition> Keys { get; }

        /// <summary>Клавиши-модификаторы (Control, Shift, Alt).</summary>
        IReadOnlyList<KeyDefinition> Modifiers { get; }

        /// <summary>Проверяет, что имя клавиши известно игре.</summary>
        bool IsKnown(string name);
    }
}