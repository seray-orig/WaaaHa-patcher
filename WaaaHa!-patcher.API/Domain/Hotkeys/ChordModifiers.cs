using System;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Модификаторы комбинации клавиш. Игра принимает только эти три.
    /// </summary>
    [Flags]
    public enum ChordModifiers
    {
        None = 0,
        Control = 1,
        Shift = 2,
        Alt = 4
    }
}