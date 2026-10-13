using WaaaHa__patcher.API.Domain.Hotkeys;

namespace WaaaHa__patcher.API.UnitTests
{
    public sealed class LuaBindingsParserTests
    {
        private readonly LuaBindingsParser _parser = new();
        private readonly LuaBindingsWriter _writer = new();

        private const string Sample = """
            ----------------------------------------------------------------------------------------------------------------
            -- Default Key Combo Bindings
            -- (c) 2004 Relic Entertainment Inc.

            bindings_version = 15.2
            bindings_locstring = "$11271752"

            bindings =
            {
            	----------------------------------------------------------------------------------------------------------------
            	-- SYSTEM COMMANDS
            	----------------------------------------------------------------------------------------------------------------
            	escape				= "Tab",
            	systemmenu			= "Escape",
            	objectivesmenu		= "Control+O",
            	buildadv			= "",
            	-- These items appear as abilities to the player but are actually extensions
            	rampage			= "R",

            	-- BUILDINGS FOR MARINES
            	marine_hq					= "H",
            	marine_bolter_turret			= "T",	-- tau commander trap
            }

            camera_bindings =
            {
            	camera_panleft		= "Left,Shift+A",
            	camera_rotate		= "Alt",
            }
            """;

        [Fact]
        public void РазбираетШапку()
        {
            var document = _parser.Parse(SplitLines());

            Assert.Equal("15.2", document.Version);
            Assert.Equal("$11271752", document.DisplayName);
            Assert.Equal(["bindings", "camera_bindings"], document.Tables.Select(t => t.Name));
        }

        [Fact]
        public void РазбираетЗначенияИХвостовыеКомментарии()
        {
            var table = _parser.Parse(SplitLines()).MainTable!;

            Assert.Equal("Tab", table.Find("escape")!.Value);
            Assert.Equal(string.Empty, table.Find("buildadv")!.Value);
            Assert.Equal("Control+O", table.Find("objectivesmenu")!.Value);
            Assert.Equal("-- tau commander trap", table.Find("marine_bolter_turret")!.TrailingComment);
            Assert.Equal(string.Empty, table.Find("marine_hq")!.TrailingComment);
        }

        [Fact]
        public void ТаблицаКамерыРазбираетсяКакПоследовательностьКомбинаций()
        {
            var table = _parser.Parse(SplitLines()).CameraTable!;

            Assert.Equal("Left,Shift+A", table.Find("camera_panleft")!.Value);
        }

        [Fact]
        public void РазделителиСекцийНеСчитаютсяХоткеями()
        {
            var table = _parser.Parse(SplitLines()).MainTable!;

            Assert.Equal(7, table.Bindings.Count());
            Assert.Contains(table.Items, item => item is LuaRawLine raw && raw.Text.Contains("SYSTEM COMMANDS"));
        }

        [Fact]
        public void ПерезаписьСохраняетВсеХоткеиИХПорядок()
        {
            var document = _parser.Parse(SplitLines());
            var expectedOrder = document.MainTable!.Bindings.Select(b => b.Id).ToList();

            var text = _writer.Write(LuaBindingsDocument.FromTemplate(document, "Мои хоткеи"));
            var reparsed = _parser.Parse(text.Split('\n'));

            Assert.Equal(expectedOrder, reparsed.MainTable!.Bindings.Select(b => b.Id).ToList());
            Assert.Equal("Мои хоткеи", reparsed.DisplayName);
        }

        [Fact]
        public void ШапкаНачинаетсяСВерсииИИмениНабора()
        {
            var text = _writer.Write(LuaBindingsDocument.FromTemplate(_parser.Parse(SplitLines()), "Мои хоткеи"));
            var lines = text.Split('\n');

            Assert.Contains("bindings_version = 15.2", lines);
            Assert.Contains("bindings_locstring = \"Мои хоткеи\"", lines);
        }

        [Fact]
        public void КавычкиВИмениНабораЭкранируются()
        {
            var document = LuaBindingsDocument.FromTemplate(_parser.Parse(SplitLines()), "Мои \"хоткеи\"");
            var text = _writer.Write(document);

            Assert.Contains("bindings_locstring = \"Мои \\\"хоткеи\\\"\"", text);
            Assert.Equal("Мои \"хоткеи\"", _parser.Parse(text.Split('\n')).DisplayName);
        }

        private static string[] SplitLines() => Sample.Replace("\r\n", "\n").Split('\n');
    }
}