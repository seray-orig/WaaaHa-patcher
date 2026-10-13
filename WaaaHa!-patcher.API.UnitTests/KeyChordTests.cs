using WaaaHa__patcher.API.Domain.Hotkeys;

namespace WaaaHa__patcher.API.UnitTests
{
    public sealed class KeyChordTests
    {
        private readonly KeyRegistry _registry = new();
        private readonly BindingValueValidator _validator;

        public KeyChordTests() => _validator = new BindingValueValidator(_registry);

        [Theory]
        [InlineData("A", "A")]
        [InlineData("a", "A")]
        [InlineData("Control+Shift+A", "Control+Shift+A")]
        [InlineData("Shift+Control+A", "Control+Shift+A")]
        [InlineData("Alt+Shift+Control+F5", "Control+Shift+Alt+F5")]
        [InlineData("NumpadPlus", "NumpadPlus")]
        [InlineData("Period", "Period")]
        [InlineData("", "")]
        [InlineData("   ", "")]
        public void КомбинацияНормализуется(string input, string expected)
            => Assert.Equal(expected, _validator.Normalize(input));

        [Theory]
        [InlineData("Meta+A")]
        [InlineData("Control+")]
        [InlineData("Control+Control+A")]
        [InlineData("Shift+Shift")]
        [InlineData("Control+Alt")]
        [InlineData("НеКлавиша")]
        public void НераспознанноеОтклоняется(string input)
            => Assert.Null(_validator.Normalize(input));

        [Fact]
        public void ПоследовательностьКамерыСохраняетОбеКомбинации()
            => Assert.Equal("Control+Left,Shift+A", _validator.Normalize("Left+Control,Shift+A"));

        [Fact]
        public void ОдинМодификаторБезКлавишиЭтоНеКомбинация()
            => Assert.Equal("Alt", _validator.Normalize("Alt"));

        [Fact]
        public void МодификаторВместеСДругимМодификаторомБезКлавижиНедопустим()
            => Assert.Null(_validator.Normalize("Control+Shift"));

        [Fact]
        public void ПустойХоткейЭтоНеОшибка()
        {
            var result = _validator.Validate(string.Empty);

            Assert.True(result.IsValid);
            Assert.True(result.Sequence!.IsEmpty);
        }
    }

    public sealed class KeyRegistryTests
    {
        private readonly KeyRegistry _registry = new();

        [Theory]
        [InlineData("A")]
        [InlineData("Z")]
        [InlineData("0")]
        [InlineData("9")]
        [InlineData("F1")]
        [InlineData("F12")]
        [InlineData("Numpad0")]
        [InlineData("NumpadSlash")]
        [InlineData("MouseMiddle")]
        [InlineData("ScreenLeft")]
        [InlineData("Backslash")]
        [InlineData("Grave")]
        public void ИзвестныеКлавишиПринимаются(string name) => Assert.True(_registry.IsKnown(name));

        [Theory]
        [InlineData("Meta")]
        [InlineData("Numpad13")]
        [InlineData("MouseExtra")]
        [InlineData("")]
        public void НеизвестныеКлавишиОтклоняются(string name) => Assert.False(_registry.IsKnown(name));

        [Fact]
        public void МодификаторыРовноТри() => Assert.Equal(["Control", "Shift", "Alt"], _registry.Modifiers.Select(m => m.Name));

        [Fact]
        public void ВРеестреНетДублей()
            => Assert.Equal(_registry.Keys.Count, _registry.Keys.Select(k => k.Name).Distinct().Count());
    }
}