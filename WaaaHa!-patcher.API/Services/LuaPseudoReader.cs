using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;

namespace WaaaHa__patcher.API.Services
{
    public class LuaPseudoReader
    {
        public Dictionary<string, object> GetVariables(string[] luaCode)
        {
            var variables = new Dictionary<string, object>();

            var name = "";
            var valueBuilder = new StringBuilder();
            bool searchValue = false;
            bool insideTable = false;
            int braceBalance = 0;

            for (int lineIndex = 0; lineIndex < luaCode.Length; lineIndex++)
            {
                string line = luaCode[lineIndex];
                var temp = new StringBuilder();

                for (int i = 0; i < line.Length; i++)
                {
                    char c = line[i];

                    // Обнаружение комментария --
                    if (c == '-' && i + 1 < line.Length && line[i + 1] == '-')
                    {
                        if (searchValue && !insideTable)
                        {
                            // Завершаем сбор значения (комментарий после значения)
                            valueBuilder.Append(temp.ToString());
                            temp.Clear();
                        }
                        break; // пропускаем остаток строки
                    }

                    if (!searchValue)
                    {
                        // Ищем имя (до '=')
                        if (c == '=')
                        {
                            name = temp.ToString().Trim();
                            searchValue = true;
                            temp.Clear();
                            continue;
                        }
                        else if (!char.IsWhiteSpace(c))
                        {
                            temp.Append(c);
                        }
                        // пробелы игнорируем
                    }
                    else
                    {
                        // Собираем значение
                        if (c == '{' && !insideTable)
                        {
                            // Начинается таблица
                            insideTable = true;
                            braceBalance = 1;
                            valueBuilder.Append(c);
                            // Продолжаем собирать символы в valueBuilder
                        }
                        else
                        {
                            // Обычный символ значения
                            if (insideTable)
                            {
                                valueBuilder.Append(c);
                                if (c == '{') braceBalance++;
                                else if (c == '}') braceBalance--;
                            }
                            else
                            {
                                // Простое значение – собираем все символы (включая пробелы и запятые)
                                valueBuilder.Append(c);
                            }
                        }
                    }
                }

                // Если мы внутри таблицы и баланс стал 0 – таблица завершена
                if (insideTable && braceBalance == 0)
                {
                    // Парсим таблицу и сохраняем
                    string tableContent = valueBuilder.ToString().Trim();
                    variables[name] = ParseTableToStringDict(tableContent);
                    // Сбрасываем состояние
                    insideTable = false;
                    searchValue = false;
                    name = "";
                    valueBuilder.Clear();
                }
                else if (!insideTable && searchValue)
                {
                    // Если значение простое и строка закончилась (или был комментарий)
                    string rawValue = valueBuilder.ToString().Trim();
                    if (!string.IsNullOrEmpty(rawValue))
                    {
                        variables[name] = ParseSimpleValue(rawValue);
                    }
                    // Сбрасываем для следующей переменной
                    searchValue = false;
                    name = "";
                    valueBuilder.Clear();
                }
                // Если внутри таблицы и баланс не 0, продолжаем накапливать строки
            }

            return variables;
        }

        private object ParseSimpleValue(string value)
        {
            value = value.Trim();
            if (value.EndsWith(","))
                value = value.Substring(0, value.Length - 1).Trim();

            if (value.StartsWith("\"") && value.EndsWith("\""))
                return value.Substring(1, value.Length - 2);
            if (value.StartsWith("'") && value.EndsWith("'"))
                return value.Substring(1, value.Length - 2);

            if (bool.TryParse(value, out bool b))
                return b;

            if (double.TryParse(value,
                    System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture,
                    out double d))
                return value;

            return value; // nil, идентификаторы
        }

        private Dictionary<string, string> ParseTableToStringDict(string tableStr)
        {
            tableStr = tableStr.Trim();
            if (tableStr.StartsWith("{") && tableStr.EndsWith("}"))
                tableStr = tableStr.Substring(1, tableStr.Length - 2).Trim();

            var pairs = SplitByComma(tableStr);
            var dict = new Dictionary<string, string>();

            foreach (var pair in pairs)
            {
                if (string.IsNullOrEmpty(pair))
                    continue;

                int eqIndex = pair.IndexOf('=');
                if (eqIndex < 0)
                    continue;

                string key = pair.Substring(0, eqIndex).Trim();
                string val = pair.Substring(eqIndex + 1).Trim();

                if (key.StartsWith("\"") && key.EndsWith("\""))
                    key = key.Substring(1, key.Length - 2);
                else if (key.StartsWith("'") && key.EndsWith("'"))
                    key = key.Substring(1, key.Length - 2);

                if (val.EndsWith(","))
                    val = val.Substring(0, val.Length - 1).Trim();

                dict[key] = ParseSimpleValue(val)?.ToString() ?? "";
            }

            return dict;
        }

        private List<string> SplitByComma(string str)
        {
            var result = new List<string>();
            bool inQuotes = false;
            bool inSingleQuotes = false;
            int braceLevel = 0;
            int start = 0;

            for (int i = 0; i < str.Length; i++)
            {
                char c = str[i];

                if (c == '"' && !inSingleQuotes)
                    inQuotes = !inQuotes;
                else if (c == '\'' && !inQuotes)
                    inSingleQuotes = !inSingleQuotes;
                else if (c == '{' && !inQuotes && !inSingleQuotes)
                    braceLevel++;
                else if (c == '}' && !inQuotes && !inSingleQuotes)
                    braceLevel--;
                else if (c == ',' && !inQuotes && !inSingleQuotes && braceLevel == 0)
                {
                    result.Add(str.Substring(start, i - start).Trim());
                    start = i + 1;
                }
            }

            if (start < str.Length)
                result.Add(str.Substring(start).Trim());

            return result;
        }
    }
}
