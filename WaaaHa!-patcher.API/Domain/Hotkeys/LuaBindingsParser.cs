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

        [GeneratedRegex(@"^\s*(?<id>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>.*?)\s*$")]
        private static partial Regex AssignmentRegex();

        public LuaBindingsDocument ParseFile(string path) => Parse(File.ReadAllLines(path));

        public LuaBindingsDocument Parse(IEnumerable<string> lines)
        {
            var document = new LuaBindingsDocument();
            LuaTable? current = null;

            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd('\r');

                if (current is null)
                {
                    if (TableOpenRegex().IsMatch(line))
                    {
                        var name = AssignmentRegex().Match(line).Groups["id"].Value;
                        current = new LuaTable(name);
                        document.Tables.Add(current);
                    }
                    else
                    {
                        ReadHeaderLine(document, line);
                    }

                    continue;
                }

                if (TableCloseRegex().IsMatch(line))
                {
                    current = null;
                    continue;
                }

                var bindingMatch = BindingRegex().Match(line);
                if (bindingMatch.Success)
                {
                    current.Items.Add(ReadBinding(bindingMatch, line));
                    continue;
                }

                current.Items.Add(new LuaRawLine(line));
            }

            return document;
        }

        private static void ReadHeaderLine(LuaBindingsDocument document, string line)
        {
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