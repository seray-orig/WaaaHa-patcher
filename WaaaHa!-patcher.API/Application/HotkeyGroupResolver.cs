using System;

namespace WaaaHa__patcher.API.Application
{
    /// <summary>
    /// Возвращает логическую группу хоткея по префиксу его идентификатора.
    /// Группы нужны интерфейсу, чтобы разложить команды по фракциям и разделам.
    /// </summary>
    public interface IHotkeyGroupResolver
    {
        string Resolve(string bindingId);
    }

    /// <inheritdoc />
    public sealed class HotkeyGroupResolver : IHotkeyGroupResolver
    {
        public const string Common = "common";
        public const string Camera = "camera";
        public const string Addon = "addon";

        /// <summary>
        /// Префиксы, за которыми стоит конкретная фракция или союз игроков.
        /// Порядок важен: <c>dark_eldar</c> проверяется раньше <c>dark</c>, иначе способности
        /// Тёмных эльдаров попали бы в общую группу вместе с остальными.
        /// </summary>
        private static readonly string[] FactionPrefixes =
        [
            "dark_eldar", "marine", "chaos", "ork", "eldar", "tau", "necron", "guard", "sisters"
        ];

        /// <summary>Разделитель фракции и остатка идентификатора.</summary>
        private const char Separator = '_';

        public string Resolve(string bindingId)
        {
            if (string.IsNullOrWhiteSpace(bindingId))
                return Common;

            foreach (var faction in FactionPrefixes)
            {
                if (!bindingId.StartsWith(faction, StringComparison.OrdinalIgnoreCase))
                    continue;

                // Совпадение должно быть целым префиксом: «eldar» не должен ловить «dark_eldar».
                var rest = bindingId[faction.Length..];

                if (rest.Length == 0 || rest[0] == Separator)
                    return faction;
            }

            if (bindingId.StartsWith(Camera + Separator, StringComparison.OrdinalIgnoreCase))
                return Camera;

            if (bindingId.StartsWith(Addon + Separator, StringComparison.OrdinalIgnoreCase))
                return Addon;

            return Common;
        }
    }
}