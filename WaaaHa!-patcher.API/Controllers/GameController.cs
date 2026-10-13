using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Domain.Profiles;

namespace WaaaHa__patcher.API.Controllers
{
    /// <summary>
    /// То, что нужно приложению до выбора профиля: путь к игровым данным и каталог клавиш.
    /// </summary>
    [ApiController]
    [Route("api/game")]
    public sealed class GameController : ControllerBase
    {
        private readonly IGamePathsProvider _paths;
        private readonly IKeyRegistry _keys;

        public GameController(IGamePathsProvider paths, IKeyRegistry keys)
        {
            _paths = paths;
            _keys = keys;
        }

        /// <summary>Текущий путь к папке профилей.</summary>
        [HttpGet("paths")]
        public GamePathsInfo GetPaths()
        {
            var paths = _paths.Get();

            return new GamePathsInfo(paths.ProfilesRoot, paths.Exists, paths.IsCustom, paths.ProfilesRoot);
        }

        /// <summary>Задать путь к папке профилей вручную.</summary>
        [HttpPost("paths")]
        public GamePathsInfo SetPaths(SetGamePathsRequest request)
        {
            if (!_paths.TrySetProfilesRoot(request.ProfilesRoot))
                throw new Application.HotkeyException(
                    Application.HotkeyErrorCode.GameFolderNotFound,
                    $"Каталог «{request.ProfilesRoot}» не найден.",
                    request.ProfilesRoot);

            var paths = _paths.Get();

            return new GamePathsInfo(paths.ProfilesRoot, paths.Exists, paths.IsCustom, paths.ProfilesRoot);
        }

        /// <summary>Путь, который приложение определило само.</summary>
        [HttpGet("paths/default")]
        public string GetDefaultPaths() => _paths.DetectDefaultProfilesRoot();

        /// <summary>Все клавиши, которые принимает игра.</summary>
        [HttpGet("keys")]
        public KeyCatalog GetKeys()
            => new(_keys.Keys
                .Select(key => new KeyInfo(key.Name, key.Category.ToString(), key.IsModifier))
                .ToList());
    }

    /// <param name="ProfilesRoot">Папка с профилями.</param>
    /// <param name="Exists">Существует ли она.</param>
    /// <param name="IsCustom">Задана ли вручную.</param>
    /// <param name="DefaultProfilesRoot">Путь, найденный автоматически.</param>
    public sealed record GamePathsInfo(
        string ProfilesRoot,
        bool Exists,
        bool IsCustom,
        string DefaultProfilesRoot);

    public sealed record SetGamePathsRequest(string ProfilesRoot);
}