namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Профиль игрока: папка <c>Profile1</c>, <c>Profile2</c> и так далее.
    /// </summary>
    /// <param name="Name">Имя папки, например <c>Profile1</c>.</param>
    /// <param name="Directory">Полный путь к папке профиля.</param>
    /// <param name="DisplayName">Имя, которое видит игрок: ui_name.dat, иначе name.dat.</param>
    /// <param name="SteamId">Идентификатор Steam, если профиль привязан к аккаунту.</param>
    public sealed record ProfileInfo(string Name, string Directory, string DisplayName, string? SteamId);
}