using System;
using System.Collections.Generic;

namespace WaaaHa__patcher.API.Application
{
    /// <summary>
    /// Разделы, в которые интерфейс раскладывает команды внутри фракции.
    /// </summary>
    public enum HotkeyCategory
    {
        /// <summary>Пехота и монстры.</summary>
        Infantry,

        /// <summary>Техника.</summary>
        Vehicle,

        /// <summary>Постройки.</summary>
        Building,

        /// <summary>Способности и особые действия.</summary>
        Ability,

        /// <summary>Исследования.</summary>
        Research,

        /// <summary>Улучшения оружия.</summary>
        WeaponUpgrade,

        /// <summary>Дополнения к постройкам.</summary>
        Addon,

        /// <summary>Панель команд, интерфейс игры, камера.</summary>
        System
    }

    /// <summary>
    /// Определяет раздел команды по заголовку секции из файла биндингов.
    /// </summary>
    /// <remarks>
    /// Заголовки файлов стабильны и заданы Relic: «TROOPERS FOR MARINES»,
    /// «BUILDINGS FOR ELDAR» и так далее. Подразделы вроде «HQ» или «BARRACKS»
    /// ничего не меняют, поэтому подраздел наследует раздел родителя.
    /// </remarks>
    public interface IHotkeyCategoryResolver
    {
        HotkeyCategory Resolve(string sectionTitle);
    }

    /// <inheritdoc />
    public sealed class HotkeyCategoryResolver : IHotkeyCategoryResolver
    {
        private static readonly (string Marker, HotkeyCategory Category)[] Rules =
        [
            ("BUILDINGS FOR", HotkeyCategory.Building),
            ("TROOPERS FOR", HotkeyCategory.Infantry),
            ("ABILITIES FOR", HotkeyCategory.Ability),
            ("RESEARCH FOR", HotkeyCategory.Research),
            ("WEAPON UPGRADES FOR", HotkeyCategory.WeaponUpgrade),
            ("ADDONS FOR", HotkeyCategory.Addon)
        ];

        public HotkeyCategory Resolve(string sectionTitle)
        {
            var title = sectionTitle?.Trim() ?? string.Empty;

            foreach (var (marker, category) in Rules)
            {
                if (title.StartsWith(marker, StringComparison.OrdinalIgnoreCase))
                    return category;
            }

            return HotkeyCategory.System;
        }
    }
}