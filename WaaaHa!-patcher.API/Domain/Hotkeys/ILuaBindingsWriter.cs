using System.IO;

namespace WaaaHa__patcher.API.Domain.Hotkeys
{
    /// <summary>
    /// Собирает <see cref="LuaBindingsDocument"/> обратно в файл, который примет игра.
    /// </summary>
    public interface ILuaBindingsWriter
    {
        string Write(LuaBindingsDocument document);

        void WriteFile(LuaBindingsDocument document, string path);
    }
}