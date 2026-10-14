using System;
using System.Linq;
using System.Text;

namespace WaaaHa__patcher.API.Domain.Profiles
{
    /// <summary>
    /// Правила имени файла в папке профиля.
    ///
    /// Игра живёт только под Windows, и набор хоткеев в итоге окажется именно там.
    /// Поэтому проверка идёт по правилам Windows, а не по правилам машины, на которой
    /// запущены тесты: на Linux <c>Path.GetInvalidFileNameChars</c> возвращает всего
    /// два символа и пропускает имя, на котором Windows просто не даст создать файл.
    /// </summary>
    public static class WindowsFileName
    {
        private const string ForbiddenSymbols = "<>:\"/\\|?*";

        /// <summary>Символ, который Windows не допускает в имени файла.</summary>
        public static bool IsForbidden(char symbol)
            => symbol < ' ' || ForbiddenSymbols.Contains(symbol, StringComparison.Ordinal);

        /// <summary>Заменяет пробелы и запрещённые символы подчёркиваниями.</summary>
        public static string Sanitize(string fileName)
        {
            var builder = new StringBuilder(fileName.Length);

            foreach (var symbol in fileName)
                builder.Append(symbol == ' ' || IsForbidden(symbol) ? '_' : symbol);

            return builder.ToString();
        }

        /// <summary>Проверяет форму имени, не обращаясь к диску.</summary>
        public static bool IsValid(string fileName)
            => !string.IsNullOrWhiteSpace(fileName)
               && !fileName.Contains("..", StringComparison.Ordinal)
               && fileName.All(symbol => !IsForbidden(symbol));
    }
}
