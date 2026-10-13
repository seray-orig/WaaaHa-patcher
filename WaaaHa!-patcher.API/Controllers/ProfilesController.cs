using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Profiles;

namespace WaaaHa__patcher.API.Controllers
{
    /// <summary>
    /// Профили игрока. Их может быть несколько, выбор делает игрок.
    /// </summary>
    [ApiController]
    [Route("api/profiles")]
    public sealed class ProfilesController : ControllerBase
    {
        private readonly IProfileRepository _profiles;

        public ProfilesController(IProfileRepository profiles) => _profiles = profiles;

        /// <summary>Все найденные профили.</summary>
        [HttpGet]
        public IReadOnlyList<ProfileInfo> GetProfiles() => _profiles.GetAll();
    }
}