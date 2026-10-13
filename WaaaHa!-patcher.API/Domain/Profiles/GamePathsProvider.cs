using System;
using System.IO;
using System.Text.Json;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Ищет <c>%APPDATA%\Relic Entertainment\Dawn of War\Profiles</c>. Ручной путь запоминается
    /// между запусками, чтобы приложение работало и на нестандартных установках.
    /// </summary>
    public sealed class GamePathsProvider : IGamePathsProvider
    {
        private const string DefaultRelativePath = @"Relic Entertainment\Dawn of War\Profiles";
        private const string SettingsFileName = "settings.json";

        private readonly string _settingsPath;
        private string? _customProfilesRoot;

        public GamePathsProvider(string? settingsPath = null)
        {
            _settingsPath = settingsPath ?? BuildDefaultSettingsPath();
            _customProfilesRoot = ReadCustomRoot();
        }

        public GamePaths Get()
        {
            var profilesRoot = _customProfilesRoot ?? DetectDefaultProfilesRoot();

            return new GamePaths(profilesRoot, Directory.Exists(profilesRoot), _customProfilesRoot is not null);
        }

        public bool TrySetProfilesRoot(string profilesRoot)
        {
            if (string.IsNullOrWhiteSpace(profilesRoot) || !Directory.Exists(profilesRoot))
                return false;

            _customProfilesRoot = Path.GetFullPath(profilesRoot);
            WriteCustomRoot(_customProfilesRoot);

            return true;
        }

        public string DetectDefaultProfilesRoot()
            => Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                DefaultRelativePath);

        private static string BuildDefaultSettingsPath()
            => Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "WaaaHa-patcher",
                SettingsFileName);

        private string? ReadCustomRoot()
        {
            try
            {
                if (!File.Exists(_settingsPath))
                    return null;

                using var stream = File.OpenRead(_settingsPath);
                var settings = JsonSerializer.Deserialize<Settings>(stream);

                return string.IsNullOrWhiteSpace(settings?.ProfilesRoot) ? null : settings.ProfilesRoot;
            }
            catch
            {
                return null;
            }
        }

        private void WriteCustomRoot(string profilesRoot)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(_settingsPath)!);

                using var stream = File.Create(_settingsPath);
                JsonSerializer.Serialize(stream, new Settings { ProfilesRoot = profilesRoot });
            }
            catch
            {
                // Настройка просто не переживёт перезапуск — работать можно и без неё.
            }
        }

        private sealed class Settings
        {
            public string? ProfilesRoot { get; set; }
        }
    }
}