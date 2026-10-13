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

        /// <summary>Префиксы, за которыми стоит конкретная фракция или союз игроков.</summary>
        private static readonly string[] FactionPrefixes =
        [
            "marine", "chaos", "ork", "eldar", "tau", "necron", "guard", "dark_eldar", "sisters"
        ];

        public string Resolve(string bindingId)
        {
            if (string.IsNullOrWhiteSpace(bindingId))
                return Common;

            var separator = bindingId.IndexOf('_');
            var prefix = separator < 0 ? bindingId : bindingId[..separator];

            if (prefix.Equals("camera", System.StringComparison.OrdinalIgnoreCase))
                return Camera;

            foreach (var faction in FactionPrefixes)
            {
                if (prefix.Equals(faction, System.StringComparison.OrdinalIgnoreCase))
                    return faction;
            }

            if (prefix.Equals(Addon, System.StringComparison.OrdinalIgnoreCase))
                return Addon;

            return Common;
        }
    }
}