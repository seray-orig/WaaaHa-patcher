using WaaaHa__patcher.API.Models;

namespace WaaaHa__patcher.API.Services
{
    public class FileSystemManager
    {
        private FilePath _dataPath = new(false, "Не удалось найти \"AppData\\Roaming\\Relic Entertainment\\Dawn of War\".");

        public FilePath GetGameDataPath()
        {
            var roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

            var gameData = Path.Combine(roaming, "Relic Entertainment", "Dawn of War");

            if (Directory.Exists(gameData))
                _dataPath = new(true, gameData);

            return _dataPath;
        }

        public bool SetGameDataPath(string path)
        {
            if (Directory.Exists(path))
            {
                _dataPath = new(true, path);
                return true;
            }
            else
            {
                _dataPath = new(false, "Указанная директория не существует.");
                return false;
            }
        }

        public bool FileExists(string path)
        {
            return File.Exists(path);
        }

        public string ReadAllText(string path)
        {
            return File.ReadAllText(path);
        }

        public string[] ReadLines(string path)
        {
            return File.ReadLines(path).ToArray();
        }
    }
}
