using Microsoft.AspNetCore.Mvc;
using WaaaHa__patcher.API.Models;
using WaaaHa__patcher.API.Services;

namespace WaaaHa__patcher.API.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public sealed class HotkeysController(FileSystemManager fsManager, LuaPseudoReader luaReader) : ControllerBase
    {
        private readonly FileSystemManager _fsManager = fsManager;
        private readonly LuaPseudoReader _luaReader = luaReader;

        private List<Profile> _profiles = [];

        [HttpGet]
        public ActionResult<FilePath> GetGameDataPath()
        {
            return _fsManager.GetGameDataPath();
        }

        [HttpPost]
        public ActionResult SetGameDataPath(string path)
        {
            if (_fsManager.SetGameDataPath(path))
                return Ok();

            return Problem(GetGameDataPath().Value!.Path);
        }

        [HttpGet]
        public ActionResult<List<Profile>> GetProfiles()
        {
            return _profiles;
        }

        [HttpGet]
        public ActionResult UpdateProfiles()
        {
            _profiles.Clear();

            if (!GetGameDataPath().Value!.Exists)
                return Problem(GetGameDataPath().Value!.Path);

            foreach (string k in Directory.EnumerateDirectories(GetGameDataPath().Value!.Path + "\\Profiles"))
            {
                // Последний символ удаляется ибо там откуда-то берётся знак ? вопроса.
                var profileName = _fsManager.FileExists(k + "\\ui_name.dat") ? _fsManager.ReadAllText(k + "\\ui_name.dat")[..^1] :
                           _fsManager.FileExists(k + "\\name.dat") ? _fsManager.ReadAllText(k + "\\name.dat")[..^1] : "unknown";

                var schemes = new List<HotkeyScheme>();

                var hotkeysFiles = Directory.GetFiles(k).Where(fileName => fileName.ToLower().EndsWith(".lua"));
                foreach (var file in hotkeysFiles)
                {
                    var content = _fsManager.ReadLines(file);
                    if (!content.Contains("bindings ="))
                        continue;
                    
                    var variables = _luaReader.GetVariables(content);

                    var schemeName = Convert.ToString(variables[HotkeyScheme.strName]) ?? "unknown";
                    if(!float.TryParse(variables[HotkeyScheme.strVersion].ToString(), out float version)) version = 15.2f;
                    var bindings = variables.Where(kvp => kvp.Value is Dictionary<string, object>)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => ((Dictionary<string, object>)kvp.Value)
                            .ToDictionary(
                                inner => inner.Key,
                                inner => inner.Value?.ToString() ?? ""
                            )
                    );
                    
                    schemes.Add(new HotkeyScheme(schemeName, version, bindings));
                };

                _profiles.Add(new Profile(profileName, schemes));
            }

            return Ok();
        }
    }
}
