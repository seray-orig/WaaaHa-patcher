using System.Collections.Generic;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Перечисление профилей игрока. У игрока их может быть несколько, выбирает он сам.
    /// </summary>
    public interface IProfileRepository
    {
        IReadOnlyList<ProfileInfo> GetAll();

        /// <summary>Возвращает профиль по имени папки или <c>null</c>, если такого нет.</summary>
        ProfileInfo? Get(string name);
    }
}