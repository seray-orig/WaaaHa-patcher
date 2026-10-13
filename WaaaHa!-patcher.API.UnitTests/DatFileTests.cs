using WaaaHa__patcher.API.Domain.Profiles;

namespace WaaaHa__patcher.API.UnitTests
{
    public sealed class DatFileTests
    {
        [Fact]
        public void Utf16СНепарнымНулевымБайтомНеДаётМусорВКонце()
            => Assert.Equal("seray", DatFile.Decode(Utf16("seray", danglingByte: true)));

        [Fact]
        public void Utf16СНормальнымЗавершением()
            => Assert.Equal("seray", DatFile.Decode(Utf16("seray")));

        [Fact]
        public void SteamIdЧитаетсяПолностью()
            => Assert.Equal("steam_76561198345835446", DatFile.Decode(Utf16("steam_76561198345835446", true)));

        [Fact]
        public void Utf8БезBomТожеЧитается()
            => Assert.Equal("331", DatFile.Decode("331"u8.ToArray()));

        [Fact]
        public void ПустойФайлДаётПустуюСтроку()
            => Assert.Equal(string.Empty, DatFile.Decode([]));

        /// <summary>Собирает байты ровно так, как их пишет игра.</summary>
        private static byte[] Utf16(string text, bool danglingByte = false)
        {
            var bytes = new List<byte> { 0xFF, 0xFE };

            foreach (var symbol in text)
            {
                bytes.Add((byte)symbol);
                bytes.Add(0);
            }

            if (danglingByte)
                bytes.Add(0);

            return [.. bytes];
        }
    }
}