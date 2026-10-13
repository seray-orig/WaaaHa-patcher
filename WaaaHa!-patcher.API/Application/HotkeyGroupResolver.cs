using System;
using System.Collections.Generic;

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
        /// Порядок важен: <c>dark_eldar</c> проверяется раньше остальных, иначе способности
        /// Тёмных Эльдаров попали бы в общую группу.
        /// </summary>
        private static readonly string[] FactionPrefixes =
        [
            "dark_eldar", "marine", "chaos", "ork", "eldar", "tau", "necron", "guard", "sisters"
        ];

        /// <summary>Часть рас называет дополнения к постройкам как addon_тау_hq_1.</summary>
        private const string AddonPrefix = "addon_";

        /// <summary>Разделитель фракции и остатка идентификатора.</summary>
        private const char Separator = '_';

        /// <summary>
        /// Идентификаторы без фракционного префикса: в исходных файлах такие есть, и это
        /// опечатки авторов. Без явного сопоставления они попали бы в общую группу.
        /// </summary>
        private static readonly Dictionary<string, string> Strays = new(StringComparer.Ordinal)
        {
            ["webway_gate_healing_research"] = "eldar",
            ["earthshaker_round"] = "ork"
        };

        public string Resolve(string bindingId)
        {
            if (string.IsNullOrWhiteSpace(bindingId))
                return Common;

            if (Strays.TryGetValue(bindingId, out var strayFaction))
                return strayFaction;

            var body = bindingId.StartsWith(AddonPrefix, StringComparison.OrdinalIgnoreCase)
                ? bindingId[AddonPrefix.Length..]
                : bindingId;

            foreach (var faction in FactionPrefixes)
            {
                if (!body.StartsWith(faction, StringComparison.OrdinalIgnoreCase))
                    continue;

                // Совпадение должно быть целым префиксом: «eldar» не должен ловить «dark_eldar».
                var rest = body[faction.Length..];

                if (rest.Length == 0 || rest[0] == Separator)
                    return faction;
            }

            if (bindingId.StartsWith(Camera + Separator, StringComparison.OrdinalIgnoreCase))
                return Camera;

            if (bindingId.StartsWith(AddonPrefix, StringComparison.OrdinalIgnoreCase))
                return Addon;

            return Common;
        }
    }
}