using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using WaaaHa__patcher.API.Utilities;

namespace WaaaHa__patcher.API.UnitTests
{
    /// <summary>
    /// Правило, по которому запрос страницы превращается в index.html.
    ///
    /// Проверяется отдельно от сервера, потому что ошибка здесь молчаливая: клиент
    /// получает 404 вместо экрана и выглядит при этом полностью рабочим.
    /// </summary>
    public sealed class AppConfiguratorTests
    {
        [Theory]
        [InlineData("/")]
        [InlineData("/profiles/Profile1")]
        [InlineData("/profiles/Profile1/MY_HOTKEYS.LUA")]
        [InlineData("/profiles/Profile1/MY_HOTKEYS.LUA?create=1")]
        public void ПереходБраузераОтдаётсяКлиенту(string path)
            => Assert.True(AppConfigurator.WantsPage(Request(path, "text/html,application/xhtml+xml")));

        [Theory]
        [InlineData("/hotkey-images/faction_marine.jpg")]
        [InlineData("/WaaHa.ico")]
        [InlineData("/assets/index-abc.js")]
        public void ЗапросРесурсаНеПодменяетсяКлиентом(string path)
        {
            Assert.False(AppConfigurator.WantsPage(Request(path, "image/avif,image/webp,*/*")));
            Assert.False(AppConfigurator.WantsPage(Request(path, "*/*")));
            Assert.False(AppConfigurator.WantsPage(Request(path, null)));
        }

        [Fact]
        public void ЗапросКApiНеПодменяетсяКлиентом()
        {
            var request = Request("/api/profiles", "text/html,application/xhtml+xml");

            Assert.False(AppConfigurator.WantsPage(request));
        }

        private static HttpRequest Request(string path, string? accept)
        {
            var context = new DefaultHttpContext();
            context.Request.Path = path;

            if (accept is not null)
                context.Request.Headers.Accept = new StringValues(accept);

            return context.Request;
        }
    }
}
