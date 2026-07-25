using WaaaHa__patcher.API.Services;

namespace WaaaHa__patcher.API.UnitTests
{
    public class UnitTest1
    {
        [Fact]
        public void Test1()
        {
            var luaReader = new LuaPseudoReader();

            var dic = new Dictionary<string, object>();
            dic.Add("bindings_version", "15.2");
            var dic2 = new Dictionary<string, string>();
            dic2.Add("x", "один");
            dic2.Add("y", "два");
            dic.Add("bib", dic2);
            var result = luaReader.GetVariables(new string[] { "bindings_version = 15.2", "--Алё", "bib = { x = \"один\", y = \"два\" }" });

            Assert.Equal(dic, result);
        }
    }
}
