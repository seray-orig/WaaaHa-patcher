using System.Collections.Generic;
using System.IO;
using System.Text;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <inheritdoc />
    public sealed class LuaBindingsWriter : ILuaBindingsWriter
    {
        private const string Indent = "\t";
        private const string SeparatorLine = "\t" + "----------------------------------------------------------------------------------------------------------------";

        /// <summary>
        /// Шапка намеренно короткая: длинный дизайн-документ Relic из исходных файлов в
        /// пользовательский набор попадать не должен.
        /// </summary>
        private static readonly string[] HeaderLines =
        [
            "------------------------------------------------------------------",
            "-- Hotkey set created with WaaaHa!-patcher.",
            "-- The game reads this file on every launch and shows it in the hotkey list,",
            "-- so all changes made here survive restarts and updates of the game itself.",
            "------------------------------------------------------------------"
        ];

        public string Write(LuaBindingsDocument document)
        {
            var builder = new StringBuilder();

            foreach (var line in HeaderLines)
                builder.Append(line).Append('\n');

            // Откуда набор вырос — только имя, без расширения и пути. По нему редактор
            // находит файл хоткеев и знает стандартные значения клавиш, к которым
            // возвращает сброс по цифре 0.
            if (!string.IsNullOrEmpty(document.BaseName))
                builder.Append("-- ")
                    .Append(LuaBindingsDocument.BasedOnComment)
                    .Append(": ")
                    .Append(document.BaseName)
                    .Append('\n');

            builder.Append('\n');

            builder.Append(LuaBindingsDocument.BindingsVersionField)
                .Append(" = ")
                .Append(LuaBindingsDocument.SupportedVersion)
                .Append('\n');

            builder.Append(LuaBindingsDocument.BindingsLocStringField)
                .Append(" = \"")
                .Append(LuaBindingsParser.Escape(document.DisplayName))
                .Append('"')
                .Append('\n')
                .Append('\n');

            for (var i = 0; i < document.Tables.Count; i++)
            {
                WriteTable(builder, document.Tables[i]);

                if (i < document.Tables.Count - 1)
                    builder.Append('\n');
            }

            return builder.ToString();
        }

        public void WriteFile(LuaBindingsDocument document, string path)
        {
            var directory = Path.GetDirectoryName(path);

            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(path, Write(document), new UTF8Encoding(false));
        }

        private static void WriteTable(StringBuilder builder, LuaTable table)
        {
            builder.Append(table.Name).Append(" =\n{\n");

            var items = table.Items;

            if (items.Count == 0)
                builder.Append(SeparatorLine).Append('\n');

            for (var i = 0; i < items.Count; i++)
            {
                switch (items[i])
                {
                    case LuaBinding binding:
                        WriteBinding(builder, binding);
                        break;

                    case LuaRawLine raw:
                        builder.Append(raw.Text).Append('\n');
                        break;
                }
            }

            builder.Append("}\n");
        }

        private static void WriteBinding(StringBuilder builder, LuaBinding binding)
        {
            builder.Append(binding.Indent.Length == 0 ? Indent : binding.Indent)
                .Append(binding.Id)
                .Append(" = \"")
                .Append(LuaBindingsParser.Escape(binding.Value))
                .Append('"')
                .Append(string.IsNullOrEmpty(binding.Suffix) ? "," : binding.Suffix);

            if (!string.IsNullOrEmpty(binding.TrailingComment))
                builder.Append('\t').Append(binding.TrailingComment);

            builder.Append('\n');
        }
    }
}