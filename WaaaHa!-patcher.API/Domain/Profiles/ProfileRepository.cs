using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <inheritdoc />
    public sealed partial class ProfileRepository : IProfileRepository
    {
        private const string DisplayNameFile = "ui_name.dat";
        private const string InternalNameFile = "name.dat";
        private const string SteamPrefix = "steam_";

        private readonly IGamePathsProvider _paths;

        public ProfileRepository(IGamePathsProvider paths) => _paths = paths;

        public IReadOnlyList<ProfileInfo> GetAll()
        {
            var profilesRoot = _paths.Get().ProfilesRoot;

            if (!Directory.Exists(profilesRoot))
                return [];

            return Directory.EnumerateDirectories(profilesRoot)
                .Select(directory => new DirectoryInfo(directory))
                .Where(directory => ProfileNameRegex().IsMatch(directory.Name))
                .OrderBy(directory => ProfileOrderRegex().Match(directory.Name) is { Success: true } order
                    ? int.Parse(order.Groups["index"].Value)
                    : int.MaxValue)
                .ThenBy(directory => directory.Name, StringComparer.Ordinal)
                .Select(Read)
                .ToList();
        }

        public ProfileInfo? Get(string name)
            => GetAll().FirstOrDefault(profile => string.Equals(profile.Name, name, StringComparison.OrdinalIgnoreCase));

        private static ProfileInfo Read(DirectoryInfo directory)
        {
            var internalName = ReadText(Path.Combine(directory.FullName, InternalNameFile));
            var uiName = ReadText(Path.Combine(directory.FullName, DisplayNameFile));

            var steamId = internalName.StartsWith(SteamPrefix, StringComparison.OrdinalIgnoreCase)
                ? internalName
                : null;

            var displayName = !string.IsNullOrWhiteSpace(uiName) ? uiName : internalName;

            if (string.IsNullOrWhiteSpace(displayName))
                displayName = directory.Name;

            return new ProfileInfo(directory.Name, directory.FullName, displayName, steamId);
        }

        /// <summary>
        /// Читает файл .dat. В исходниках игры он записан без перевода строки, но бывают
        /// варианты с BOM и \r\n — поэтому значение нормализуется.
        /// </summary>
        private static string ReadText(string path)
        {
            try
            {
                if (!File.Exists(path))
                    return string.Empty;

                var text = File.ReadAllText(path).Trim('\uFEFF', '\r', '\n', '\0', ' ', '\t');

                return text;
            }
            catch
            {
                return string.Empty;
            }
        }

        [GeneratedRegex(@"^Profile\d+$", RegexOptions.IgnoreCase)]
        private static partial Regex ProfileNameRegex();

        [GeneratedRegex(@"^Profile(?<index>\d+)$", RegexOptions.IgnoreCase)]
        private static partial Regex ProfileOrderRegex();
    }
}