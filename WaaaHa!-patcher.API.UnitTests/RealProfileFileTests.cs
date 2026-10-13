using System.IO;
using WaaaHa__patcher.API.Domain.Hotkeys;

namespace WaaaHa__patcher.API.UnitTests
{
    /// <summary>
    /// Интеграционные проверки на настоящем файле KEYDEFAULTS_MODERN.LUA из профиля игрока.
    /// Если файла нет — тест выходит раньше, чтобы сборка не ломалась на других машинах.
    /// </summary>
    public sealed class RealProfileFileTests
    {
        private const string ModernBindingsRelativePath =
            @"Relic Entertainment\Dawn of War\Profiles\Profile1\KEYDEFAULTS_MODERN.LUA";

        private readonly LuaBindingsParser _parser = new();
        private readonly LuaBindingsWriter _writer = new();

        [Fact]
        public void РеальныйФайлРазбираетсяБезПотериХоткеев()
        {
            var path = FindRealFile();
            if (path is null)
                return;

            var document = _parser.ParseFile(path);

            Assert.Equal("$11271752", document.DisplayName);
            Assert.Equal(LuaBindingsDocument.SupportedVersion, document.Version);

            var bindings = document.MainTable!.Bindings.ToList();
            Assert.True(bindings.Count > 500, $"Ожидалось более 500 хоткеев, получено {bindings.Count}.");

            var servitor = document.MainTable.Find("marine_servitor");
            Assert.NotNull(servitor);
            Assert.Equal("B", servitor!.Value);
        }

        [Fact]
        public void ПослеПерезаписиФайлСноваРазбираетсяИНеТеряетТаблицуКамеры()
        {
            var path = FindRealFile();
            if (path is null)
                return;

            var original = _parser.ParseFile(path);
            var beforeIds = original.MainTable!.Bindings.Select(binding => binding.Id).ToList();

            var rewritten = LuaBindingsDocument.FromTemplate(original, "Тестовый набор");
            var text = _writer.Write(rewritten);

            var reparsed = _parser.Parse(text.Split('\n'));

            Assert.Equal("Тестовый набор", reparsed.DisplayName);
            Assert.NotNull(reparsed.CameraTable);
            Assert.Equal(beforeIds, reparsed.MainTable!.Bindings.Select(binding => binding.Id).ToList());
            Assert.All(reparsed.MainTable.Bindings, binding => Assert.Equal(string.Empty, binding.Value));

            // Управление камерой в интерфейсе не редактируется, поэтому переносится с основы.
            Assert.Equal("Left,Shift+A", reparsed.CameraTable!.Find("camera_panleft")!.Value);
        }

        [Fact]
        public void ВсеХоткеиРеальногоФайлаПроходятВалидациюИгры()
        {
            var path = FindRealFile();
            if (path is null)
                return;

            var validator = new BindingValueValidator(new KeyRegistry());
            var document = _parser.ParseFile(path);

            var invalid = new List<string>();

            foreach (var table in document.Tables)
            {
                foreach (var binding in table.Bindings)
                {
                    var result = validator.Validate(binding.Value);

                    if (!result.IsValid)
                        invalid.Add($"{table.Name}.{binding.Id} = \"{binding.Value}\" → {result.InvalidPart}");
                }
            }

            Assert.True(invalid.Count == 0, string.Join(Environment.NewLine, invalid));
        }

        [Fact]
        public void ПерезаписанныйФайлПринимаетсяСамойИгрой()
        {
            var path = FindRealFile();
            if (path is null)
                return;

            var original = _parser.ParseFile(path);
            var document = LuaBindingsDocument.FromTemplate(original, "Мой набор");

            foreach (var binding in document.MainTable!.Bindings)
                binding.Value = "Control+Shift+F5";

            var validator = new BindingValueValidator(new KeyRegistry());
            var reparsed = _parser.Parse(_writer.Write(document).Split('\n'));

            foreach (var binding in reparsed.MainTable!.Bindings)
                Assert.True(
                    validator.Validate(binding.Value).IsValid,
                    $"После перезаписи появилась недопустимая комбинация: {binding.Id} = {binding.Value}.");
        }

        private static string? FindRealFile()
        {
            var roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var path = Path.Combine(roaming, ModernBindingsRelativePath);

            return File.Exists(path) ? path : null;
        }
    }
}