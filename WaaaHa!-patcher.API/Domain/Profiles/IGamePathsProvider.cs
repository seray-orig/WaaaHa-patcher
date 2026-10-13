namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Расположение игровых данных. Играть можно только на Windows, но поиск пути оставлен
    /// абстрактным, чтобы его можно было подменить в тестах.
    /// </summary>
    public interface IGamePathsProvider
    {
        /// <summary>Текущий путь к папке профилей и признак того, что она существует.</summary>
        GamePaths Get();

        /// <summary>Переопределяет путь вручную. Возвращает <c>false</c>, если каталога нет.</summary>
        bool TrySetProfilesRoot(string profilesRoot);

        /// <summary>Возвращает путь к профилям по умолчанию из профиля пользователя Windows.</summary>
        string DetectDefaultProfilesRoot();
    }

    /// <param name="ProfilesRoot">Папка <c>...\Dawn of War\Profiles</c>.</param>
    /// <param name="Exists">Существует ли папка.</param>
    /// <param name="IsCustom">Был ли путь задан пользователем вручную.</param>
    public sealed record GamePaths(string ProfilesRoot, bool Exists, bool IsCustom);
}