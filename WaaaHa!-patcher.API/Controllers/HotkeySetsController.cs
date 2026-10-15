using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using WaaaHa__patcher.API.Application;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Utilities;

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

        /// <summary>Наборы, которые приложение везёт с собой и предлагает основой.</summary>
        [HttpGet("/api/presets")]
        public IReadOnlyList<HotkeyPresetSummary> Presets() => _sets.ListPresets();

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
        public IActionResult Delete(string profile, string fileName)
        {
            _sets.Delete(profile, fileName);

            // 204, а не пустой 200: методу удаления нечего возвращать, и клиенту не
            // нужно гадать, разбирать ли пустое тело как JSON.
            return NoContent();
        }

        /// <summary>
        /// Показать файл набора средствами системы: открыть его связанной программой
        /// или открыть папку профиля с выделенным файлом.
        /// </summary>
        /// <remarks>
        /// Запрос не читает и не меняет файл, но намеренно не GET: открытие окна
        /// для того, кто нажал ссылку, ещё и от предзагрузки страницы, — не то
        /// действие, о котором стоит просить.
        /// </remarks>
        [HttpPost("{fileName}/reveal")]
        public IActionResult Reveal(string profile, string fileName, RevealHotkeySetRequest? request)
        {
            _sets.Reveal(profile, fileName, ParseTarget(request?.Target));

            return NoContent();
        }

        private static ShellRevealTarget ParseTarget(string? target)
            => string.Equals(target, "folder", StringComparison.OrdinalIgnoreCase)
                ? ShellRevealTarget.Folder
                : ShellRevealTarget.File;
    }
}