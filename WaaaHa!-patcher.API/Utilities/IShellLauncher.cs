namespace WaaaHa__patcher.API.Utilities
{
    /// <summary>
    /// Что именно открыть системными средствами: сам файл или папку с ним.
    /// </summary>
    public enum ShellRevealTarget
    {
        /// <summary>Файл целиком, той программой, которую игрок назначил для .lua.</summary>
        File,

        /// <summary>Папка профиля, а файл в ней выделен.</summary>
        Folder
    }

    /// <summary>
    /// Запуск файлов и папок средствами операционной системы.
    ///
    /// Живёт интерфейсом, а не внутри сервиса, потому что это единственное место,
    /// где предметная область касается оболочки: подменять её придётся в тестах
    /// и на другой платформе.
    /// </summary>
    public interface IShellLauncher
    {
        /// <summary>Открывает файл связанной с ним программой.</summary>
        void OpenFile(string path);

        /// <summary>Открывает папку, выделив в ней указанный файл.</summary>
        void RevealInFolder(string path);
    }
}