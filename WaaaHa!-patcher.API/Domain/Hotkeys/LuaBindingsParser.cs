using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <inheritdoc />
    /// <remarks>
    /// Разбор построчный: игра не требует от файла настоящего Lua, достаточно стабильной
    /// структуры «присваивание = строка», поэтому полноценный интерпретатор здесь был бы лишним.
    /// </remarks>
    public sealed partial class LuaBindingsParser : ILuaBindingsParser
    {
        [GeneratedRegex(@"^(?<indent>\s*)(?<id>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>""(?:[^""\\]|\\.)*"")\s*(?<suffix>.*)$")]
        private static partial Regex BindingRegex();

        [GeneratedRegex(@"^\s*(?<id>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:\{)?\s*$")]
        private static partial Regex TableOpenRegex();

        [GeneratedRegex(@"^\s*\}\s*$")]
        private static partial Regex TableCloseRegex();

        [GeneratedRegex(@"^\s*\{\s*$")]
        private static partial Regex OpeningBraceRegex();

        [GeneratedRegex(@"^\s*(?<id>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>.*?)\s*$")]
        private static partial Regex AssignmentRegex();

        /// <summary>
        /// Пометка шапки «-- based_on: KEYDEFAULTS_GRID».
        ///
        /// Комментарий, а не поле: игра лишние поля читать не умеет, а набор тем
        /// более не должен этим заниматься.
        /// </summary>
        [GeneratedRegex(@"^\s*--\s*based_on\s*:\s*(?<file>\S+?)(?:\.lua)?\s*$", RegexOptions.IgnoreCase)]
        private static partial Regex BasedOnRegex();

        public LuaBindingsDocument ParseFile(string path) => Parse(File.ReadAllLines(path));

        public LuaBindingsDocument Parse(IEnumerable<string> lines)
        {
            var document = new LuaBindingsDocument();
            var source = lines as IReadOnlyList<string> ?? [.. lines];
            var open = new Stack<LuaTable>();
            var pendingOpen = false;

            for (var index = 0; index < source.Count; index++)
            {
                var line = source[index].TrimEnd('\r');

                if (pendingOpen)
                {
                    pendingOpen = false;

                    // Игра пишет объявление таблицы в две строки:
                    //   bindings =
                    //   {
                    // Физическая скобка относится к объявлению, а не к телу таблицы.
                    if (OpeningBraceRegex().IsMatch(line))
                        continue;
                }

                if (TableOpenRegex().IsMatch(line))
                {
                    var table = new LuaTable(AssignmentRegex().Match(line).Groups["id"].Value);

                    document.Tables.Add(table);
                    open.Push(table);
                    pendingOpen = true;
                    continue;
                }

                if (TableCloseRegex().IsMatch(line))
                {
                    if (open.Count > 0)
                        open.Pop();

                    continue;
                }

                if (open.Count == 0)
                {
                    ReadHeaderLine(document, line);
                    continue;
                }

                var bindingMatch = BindingRegex().Match(line);

                if (bindingMatch.Success)
                {
                    open.Peek().Items.Add(ReadBinding(bindingMatch, line));
                    continue;
                }

                open.Peek().Items.Add(new LuaRawLine(line));
            }

            return document;
        }

        private static void ReadHeaderLine(LuaBindingsDocument document, string line)
        {
            var basedOn = BasedOnRegex().Match(line);

            if (basedOn.Success)
            {
                document.BaseName = basedOn.Groups["file"].Value;
                return;
            }

            var match = AssignmentRegex().Match(line);
            if (!match.Success)
                return;

            var id = match.Groups["id"].Value;
            var value = match.Groups["value"].Value;

            if (id == LuaBindingsDocument.BindingsVersionField)
            {
                document.Version = value.TrimEnd(',');
            }
            else if (id == LuaBindingsDocument.BindingsLocStringField && value.Length >= 2 && value[0] == '"')
            {
                document.DisplayName = Unescape(value[1..^1].TrimEnd(','));
            }
        }

        private static LuaBinding ReadBinding(Match match, string line)
        {
            var suffix = match.Groups["suffix"].Value;

            return new LuaBinding(
                match.Groups["id"].Value,
                Unescape(match.Groups["value"].Value[1..^1]))
            {
                Indent = match.Groups["indent"].Value.Length == 0 ? LuaBinding.DefaultIndent : match.Groups["indent"].Value,
                Suffix = suffix.TrimEnd().StartsWith(',') ? "," : string.Empty,
                TrailingComment = ExtractTrailingComment(suffix)
            };
        }

        /// <summary>Вытаскивает хвостовой комментарий из суффикса вида <c>,-- tau commander trap</c>.</summary>
        private static string ExtractTrailingComment(string suffix)
        {
            var index = suffix.IndexOf("--", StringComparison.Ordinal);
            return index < 0 ? string.Empty : suffix[index..].TrimEnd();
        }

        internal static string Unescape(string value) => value
            .Replace("\\\"", "\"", StringComparison.Ordinal)
            .Replace("\\\\", "\\", StringComparison.Ordinal);

        internal static string Escape(string value) => value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("\"", "\\\"", StringComparison.Ordinal);

        internal static string FormatVersion(string value)
            => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out _)
                ? value
                : LuaBindingsDocument.SupportedVersion;
    }
}