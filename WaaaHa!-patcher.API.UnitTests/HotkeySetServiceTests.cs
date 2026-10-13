using WaaaHa__patcher.API.Application;
using WaaaHa__patcher.API.Contracts;
using WaaaHa__patcher.API.Domain.Hotkeys;
using WaaaHa__patcher.API.Domain.Profiles;

namespace WaaaHa__patcher.API.UnitTests
{
    /// <summary>
    /// Сквозной тест на настоящем диске: поднимает временную папку профилей, кладёт туда
    /// файлы игры и проверяет полный цикл — создание, сохранение, чтение, удаление.
    /// </summary>
    public sealed class HotkeySetServiceTests : IDisposable
    {
        private const string BuiltInBindings = """
            bindings_version = 15.2
            bindings_locstring = "$11271752"

            bindings =
            {
            	-- SYSTEM COMMANDS
            	objectivesmenu		= "Control+O",

            	-- TASKBAR COMMANDS
            	stop 				= "S",
            	move 				= "M",

            	-- BUILDINGS FOR MARINES
            	marine_hq					= "H",

            	-- TROOPERS FOR MARINES
            	marine_servitor				= "B",
            	marine_chaplain			= "Z",

            	-- TROOPERS FOR ELDAR
            	eldar_farseer				= "Y",

            	-- BUILDINGS FOR ELDAR
            	eldar_webway_gate			= "W",

            	-- TROOPERS FOR DARK ELDAR
            	dark_eldar_archon			= "C",

            	-- RESEARCH FOR MARINES
            	-- HQ
            	marine_hq_addon_1			= "U",
            	marine_frag_grenade_research	= "G",

            	-- ABILITIES FOR MARINES
            	marine_battlecry			= "B",

            	-- ABILITIES FOR DARK ELDAR
            	dark_eldar_upgrade_retinue	= "F",
            }

            camera_bindings =
            {
            	camera_panleft		= "Left,Shift+A",
            }
            """;

        private readonly string _root;
        private readonly string _profilesRoot;
        private readonly HotkeySetService _service;

        public HotkeySetServiceTests()
        {
            _root = Path.Combine(Path.GetTempPath(), "waaaha-tests", Guid.NewGuid().ToString("N"));
            _profilesRoot = Path.Combine(_root, "Profiles");

            var profileDirectory = Path.Combine(_profilesRoot, "Profile1");
            Directory.CreateDirectory(profileDirectory);

            File.WriteAllText(Path.Combine(profileDirectory, "KEYDEFAULTS_MODERN.LUA"), BuiltInBindings);
            File.WriteAllText(Path.Combine(profileDirectory, "playercfg.lua"), "Controls = { }");
            File.WriteAllText(Path.Combine(profileDirectory, "name.dat"), "steam_76561198345835446");
            File.WriteAllText(Path.Combine(profileDirectory, "ui_name.dat"), "seray");

            _service = BuildService(_profilesRoot);
        }

        public void Dispose()
        {
            if (Directory.Exists(_root))
                Directory.Delete(_root, true);
        }

        [Fact]
        public void ПрофильЧитаетНастоящееИмяИгрока()
        {
            var profiles = _serviceRepository.GetAll();

            var profile = Assert.Single(profiles);

            Assert.Equal("Profile1", profile.Name);
            Assert.Equal("seray", profile.DisplayName);
            Assert.Equal("steam_76561198345835446", profile.SteamId);
        }

        [Fact]
        public void СписокНаборовОтличаетФайлыИгрыОтПользовательских()
        {
            File.WriteAllText(
                Path.Combine(ProfileDirectory, "MY_SET.lua"),
                "bindings_version = 15.2\nbindings_locstring = \"Мой набор\"\nbindings =\n{\n\tmarine_servitor = \"Q\",\n}\n");

            var sets = _service.List("Profile1");

            var builtIn = Assert.Single(sets, set => set.IsBuiltIn);
            Assert.Equal("KEYDEFAULTS_MODERN.LUA", builtIn.FileName);
            Assert.Equal("$11271752", builtIn.DisplayName);

            var custom = Assert.Single(sets, set => !set.IsBuiltIn);
            Assert.Equal("MY_SET.lua", custom.FileName);
            Assert.Equal("Мой набор", custom.DisplayName);

            // playercfg.lua не является файлом хоткеев и в список попадать не должен.
            Assert.DoesNotContain(sets, set => set.FileName == "playercfg.lua");
        }

        [Fact]
        public void СозданиеНабораКопируетСтруктуруИНастройкиОсновы()
        {
            var details = _service.Create("Profile1", new CreateHotkeySetRequest("my set", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            Assert.Equal("MY_SET.LUA", details.FileName);
            Assert.Equal("Мой набор", details.DisplayName);
            Assert.False(details.IsBuiltIn);

            // Новый набор не должен быть пустым: игрок стартует с рабочими хоткеями основы.
            var values = details.Sections
                .SelectMany(section => section.Entries)
                .ToDictionary(entry => entry.Id, entry => entry.Value);

            Assert.Equal("S", values["stop"]);
            Assert.Equal("B", values["marine_servitor"]);
            Assert.Equal("Control+O", values["objectivesmenu"]);

            var sectionTitles = details.Sections.Select(section => section.Title).ToList();
            Assert.Contains("TASKBAR COMMANDS", sectionTitles);
            Assert.Contains("TROOPERS FOR MARINES", sectionTitles);

            var file = File.ReadAllText(Path.Combine(ProfileDirectory, "MY_SET.LUA"));
            Assert.Contains("bindings_locstring = \"Мой набор\"", file);
            Assert.Contains("bindings_version = 15.2", file);
            Assert.Contains("marine_servitor = \"B\",", file);

            // Управление камерой обнулять нельзя: редактируется оно тоже, но из основы.
            Assert.Contains("camera_panleft = \"Left,Shift+A\",", file);
        }

        [Fact]
        public void РазделыКлассифицируютсяПоЗаголовкам()
        {
            var details = _service.Get("Profile1", "KEYDEFAULTS_MODERN.LUA");

            string CategoryOf(string id) => details.Sections
                .SelectMany(section => section.Entries)
                .Single(entry => entry.Id == id)
                .Category;

            Assert.Equal("Infantry", CategoryOf("marine_servitor"));
            Assert.Equal("Building", CategoryOf("marine_hq"));
            Assert.Equal("Research", CategoryOf("marine_frag_grenade_research"));
            Assert.Equal("Ability", CategoryOf("marine_battlecry"));
            Assert.Equal("System", CategoryOf("stop"));
            Assert.Equal("System", CategoryOf("camera_panleft"));
        }

        [Fact]
        public void СпособностиТёмныхЭльдаровНеПутаютсяСЭльдарами()
        {
            var details = _service.Get("Profile1", "KEYDEFAULTS_MODERN.LUA");

            string GroupOf(string id) => details.Sections
                .SelectMany(section => section.Entries)
                .Single(entry => entry.Id == id)
                .Group;

            Assert.Equal("dark_eldar", GroupOf("dark_eldar_archon"));
            Assert.Equal("dark_eldar", GroupOf("dark_eldar_upgrade_retinue"));
            Assert.Equal("eldar", GroupOf("eldar_farseer"));
            Assert.Equal("eldar", GroupOf("eldar_webway_gate"));
            Assert.Equal("marine", GroupOf("marine_servitor"));
        }

        [Fact]
        public void СохранениеПишетТолькоПереданныеХоткеи()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            var saved = _service.Save("Profile1", "MY_SET.LUA", new SaveHotkeySetRequest(
                "Мой набор",
                new Dictionary<string, string>
                {
                    ["marine_servitor"] = "Control+Q",
                    ["stop"] = ""
                }));

            var values = saved.Sections
                .SelectMany(section => section.Entries)
                .ToDictionary(entry => entry.Id, entry => entry.Value);

            Assert.Equal("Control+Q", values["marine_servitor"]);
            Assert.Equal(string.Empty, values["stop"]);

            // Непереданный хоткей сохраняет настройку основы.
            Assert.Equal("Z", values["marine_chaplain"]);
        }

        [Fact]
        public void СозданныйНаборПереживаетПеречитывание()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));
            _service.Save("Profile1", "MY_SET.LUA", new SaveHotkeySetRequest(
                "Мой набор",
                new Dictionary<string, string> { ["marine_chaplain"] = "Shift+Numpad3" }));

            var reloaded = _service.Get("Profile1", "MY_SET.LUA");

            var value = reloaded.Sections
                .SelectMany(section => section.Entries)
                .Single(entry => entry.Id == "marine_chaplain")
                .Value;

            Assert.Equal("Shift+Numpad3", value);
        }

        [Fact]
        public void УправлениеКамеройПереноситсяСОсновыИРедактируется()
        {
            var created = _service.Create(
                "Profile1",
                new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            var panLeft = created.Sections
                .SelectMany(section => section.Entries)
                .Single(entry => entry.Id == "camera_panleft");

            Assert.Equal("Left,Shift+A", panLeft.Value);
            Assert.Equal("camera", panLeft.Group);

            _service.Save("Profile1", "MY_SET.LUA", new SaveHotkeySetRequest(
                "Мой набор",
                new Dictionary<string, string> { ["camera_panleft"] = "Right,Alt+D" }));

            var saved = _service.Get("Profile1", "MY_SET.LUA");

            Assert.Equal(
                "Right,Alt+D",
                saved.Sections.SelectMany(section => section.Entries).Single(entry => entry.Id == "camera_panleft").Value);
        }

        [Fact]
        public void ФайлИгрыНельзяИзменить()
        {
            var exception = Assert.Throws<HotkeyException>(() => _service.Save(
                "Profile1",
                "KEYDEFAULTS_MODERN.LUA",
                new SaveHotkeySetRequest("Взлом", new Dictionary<string, string> { ["stop"] = "F9" })));

            Assert.Equal(HotkeyErrorCode.ReadOnly, exception.Code);
        }

        [Fact]
        public void ФайлИгрыНельзяУдалить()
        {
            var exception = Assert.Throws<HotkeyException>(() => _service.Delete("Profile1", "KEYDEFAULTS_MODERN.LUA"));

            Assert.Equal(HotkeyErrorCode.ReadOnly, exception.Code);
        }

        [Fact]
        public void НельзяСоздатьНаборСИменемФайлаИгры()
        {
            var exception = Assert.Throws<HotkeyException>(() => _service.Create(
                "Profile1",
                new CreateHotkeySetRequest("KEYDEFAULTS_MODERN.LUA", "Подмена", "KEYDEFAULTS_MODERN.LUA")));

            Assert.Equal(HotkeyErrorCode.FileNameReserved, exception.Code);
        }

        [Fact]
        public void НельзяПерезаписатьСуществующийФайл()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            var exception = Assert.Throws<HotkeyException>(() => _service.Create(
                "Profile1",
                new CreateHotkeySetRequest("MY_SET.LUA", "Другой набор", "KEYDEFAULTS_MODERN.LUA")));

            Assert.Equal(HotkeyErrorCode.FileNameTaken, exception.Code);
        }

        [Theory]
        [InlineData("../escape.lua")]
        [InlineData("sub/dir.lua")]
        [InlineData("..\\escape.lua")]
        [InlineData("")]
        public void ОпасноеИмяФайлаОтклоняется(string fileName)
        {
            var exception = Assert.Throws<HotkeyException>(() => _service.Create(
                "Profile1",
                new CreateHotkeySetRequest(fileName, "Набор", "KEYDEFAULTS_MODERN.LUA")));

            Assert.Equal(HotkeyErrorCode.FileNameInvalid, exception.Code);
        }

        [Fact]
        public void НедопустимыеСимволыИмениЗаменяютсяПодчёркиванием()
        {
            var details = _service.Create(
                "Profile1",
                new CreateHotkeySetRequest("my set|1", "Набор", "KEYDEFAULTS_MODERN.LUA"));

            Assert.Equal("MY_SET_1.LUA", details.FileName);
        }

        [Fact]
        public void НеизвестныйХоткейОтклоняется()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            var exception = Assert.Throws<HotkeyException>(() => _service.Save(
                "Profile1",
                "MY_SET.LUA",
                new SaveHotkeySetRequest("Мой набор", new Dictionary<string, string> { ["marine_nonexistent"] = "F1" })));

            Assert.Equal(HotkeyErrorCode.UnknownBinding, exception.Code);
        }

        [Fact]
        public void НераспознаннаяКомбинацияОтклоняется()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            var exception = Assert.Throws<HotkeyException>(() => _service.Save(
                "Profile1",
                "MY_SET.LUA",
                new SaveHotkeySetRequest("Мой набор", new Dictionary<string, string> { ["stop"] = "Meta+S" })));

            Assert.Equal(HotkeyErrorCode.InvalidBindingValue, exception.Code);
        }

        [Fact]
        public void НеизвестныйПрофильОтклоняется()
        {
            var exception = Assert.Throws<HotkeyException>(() => _service.List("Profile9"));

            Assert.Equal(HotkeyErrorCode.ProfileNotFound, exception.Code);
        }

        [Fact]
        public void УдалениеУбираетФайл()
        {
            _service.Create("Profile1", new CreateHotkeySetRequest("MY_SET.LUA", "Мой набор", "KEYDEFAULTS_MODERN.LUA"));

            _service.Delete("Profile1", "MY_SET.LUA");

            Assert.False(File.Exists(Path.Combine(ProfileDirectory, "MY_SET.LUA")));
            Assert.Single(_service.List("Profile1"));
        }

        [Fact]
        public void ИмяНабораОчищаетсяОтКавычекИОбрезается()
        {
            var details = _service.Create("Profile1", new CreateHotkeySetRequest(
                "MY_SET.LUA",
                new string('A', 100) + "\"кавычки\"\n",
                "KEYDEFAULTS_MODERN.LUA"));

            Assert.Equal(64, details.DisplayName.Length);
            Assert.DoesNotContain('"', details.DisplayName);
        }

        private string ProfileDirectory => Path.Combine(_profilesRoot, "Profile1");

        private IProfileRepository _serviceRepository => new ProfileRepository(new StubPathsProvider(_profilesRoot));

        private static HotkeySetService BuildService(string profilesRoot)
        {
            IProfileRepository profiles = new ProfileRepository(new StubPathsProvider(profilesRoot));

            return new HotkeySetService(
                profiles,
                new HotkeySetRepository(profiles, new LuaBindingsParser(), new LuaBindingsWriter()),
                new HotkeyGroupResolver(),
                new HotkeyCategoryResolver(),
                new BindingValueValidator(new KeyRegistry()));
        }

        private sealed class StubPathsProvider(string profilesRoot) : IGamePathsProvider
        {
            public GamePaths Get() => new(profilesRoot, Directory.Exists(profilesRoot), false);

            public bool TrySetProfilesRoot(string path) => false;

            public string DetectDefaultProfilesRoot() => profilesRoot;
        }
    }
}