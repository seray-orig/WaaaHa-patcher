using WaaaHa__patcher.API.Application;

namespace WaaaHa__patcher.API.UnitTests
{
    public sealed class HotkeyGroupResolverTests
    {
        private readonly HotkeyGroupResolver _resolver = new();

        [Theory]
        [InlineData("marine_servitor", "marine")]
        [InlineData("chaos_lord", "chaos")]
        [InlineData("ork_warboss", "ork")]
        [InlineData("eldar_farseer", "eldar")]
        [InlineData("tau_commander", "tau")]
        [InlineData("necron_lord", "necron")]
        [InlineData("guard_commissar", "guard")]
        [InlineData("sisters_canoness", "sisters")]
        public void КомандыРасыОпределяютсяПоПрефиксу(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));

        [Theory]
        [InlineData("dark_eldar_archon", "dark_eldar")]
        [InlineData("dark_eldar_upgrade_retinue", "dark_eldar")]
        public void ТёмныеЭльдарыОтделеныОтЭльдаров(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));

        [Theory]
        [InlineData("addon_tau_hq_1", "tau")]
        [InlineData("addon_guard_hq_1", "guard")]
        [InlineData("addon_dark_eldar_hq_upgrade", "dark_eldar")]
        [InlineData("addon_sisters_holy_icon", "sisters")]
        [InlineData("addon_necron_turret", "necron")]
        public void ДополненияСФракциейВнутриИдентификатораНеПадаютВОбщуюГруппу(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));

        [Theory]
        [InlineData("marine_hq_addon_1", "marine")]
        [InlineData("eldar_support_platform_addon", "eldar")]
        public void ДополненияБезПрефиксаAddonОстаютсяУСвоейРасы(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));

        [Fact]
        public void ПрефиксДолженБытьЦелымСловом()
        {
            // «eldar» внутри другого слова не должен срабатывать как фракция.
            Assert.Equal("common", _resolver.Resolve("my_eldar_stuff"));
            Assert.Equal("common", _resolver.Resolve("chaosling"));
        }

        [Theory]
        [InlineData("move", "common")]
        [InlineData("camera_panleft", "camera")]
        [InlineData("attack", "common")]
        public void СистемныеКомандыНеПринадлежатРасе(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));

        [Theory]
        [InlineData("webway_gate_healing_research", "eldar")]
        [InlineData("earthshaker_round", "ork")]
        public void ОпечаткиВФайлеОтносятсяКСвоейРасе(string id, string expected)
            => Assert.Equal(expected, _resolver.Resolve(id));
    }
}