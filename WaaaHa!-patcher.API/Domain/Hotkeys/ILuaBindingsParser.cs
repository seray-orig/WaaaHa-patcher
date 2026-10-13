using System.IO;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Разбирает файл биндингов в <see cref="LuaBindingsDocument"/>, сохраняя порядок записей
    /// и все строки-разделители (комментарии секций).
    /// </summary>
    public interface ILuaBindingsParser
    {
        LuaBindingsDocument Parse(IEnumerable<string> lines);

        LuaBindingsDocument ParseFile(string path);
    }
}