using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using WaaaHa__patcher.API.Application;
using WaaaHa__patcher.API.Contracts;

namespace WaaaHa__patcher.API.Controllers
{
    /// <summary>
    /// Наборы хоткеев внутри выбранного профиля.
    /// </summary>
    [ApiController]
    [Route("api/profiles/{profile}/sets")]
    public sealed class HotkeySetsController : ControllerBase
    {
        private readonly IHotkeySetService _sets;

        public HotkeySetsController(IHotkeySetService sets) => _sets = sets;

        /// <summary>Все наборы профиля: встроенные файлы игры и созданные пользователем.</summary>
        [HttpGet]
        public IReadOnlyList<HotkeySetSummary> List(string profile) => _sets.List(profile);

        /// <summary>Содержимое набора для редактирования.</summary>
        [HttpGet("{fileName}")]
        public HotkeySetDetails Get(string profile, string fileName) => _sets.Get(profile, fileName);

        /// <summary>Создать свой набор на основе одного из встроенных.</summary>
        [HttpPost]
        public HotkeySetDetails Create(string profile, CreateHotkeySetRequest request)
            => _sets.Create(profile, request);

        /// <summary>Сохранить изменения в своём наборе.</summary>
        [HttpPut("{fileName}")]
        public HotkeySetDetails Save(string profile, string fileName, SaveHotkeySetRequest request)
            => _sets.Save(profile, fileName, request);

        /// <summary>Удалить свой набор.</summary>
        [HttpDelete("{fileName}")]
        public void Delete(string profile, string fileName) => _sets.Delete(profile, fileName);
    }
}