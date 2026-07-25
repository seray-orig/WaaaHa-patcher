using System.Text;

namespace WaaaHa__patcher.API.Services
{
    public class LuaPseudoReader
    {
        public Dictionary<string, object> GetVariables(string[] luaCode)
        {
            var variables = new Dictionary<string, object>();

            var temp = new StringBuilder();
            var searchValue = false;
            var dictionaryMode = false;
            string name = "nope";
            dynamic value = "nope";

            foreach (var line in luaCode)
            {
                var index = 0;
                foreach (var symbol in line)
                {
                    if (symbol == '-' & line.ElementAtOrDefault(index + 1) == '-')
                    {
                        if (searchValue)
                        {
                            value = temp.ToString();
                            searchValue = false;
                            temp.Clear();
                        }

                        break;
                    }

                    if (char.IsWhiteSpace(symbol))
                    {
                        if (searchValue)
                        {
                            value = temp.ToString();
                            searchValue = false;
                            temp.Clear();
                        }

                        index++;
                        continue;
                    }

                    if (symbol is not ('=' or '{' or '}' or ',') & char.IsWhiteSpace(line.ElementAtOrDefault(index - 1)))
                        temp.Clear();

                    if (symbol is '=' & !dictionaryMode)
                    {
                        name = temp.ToString();
                        searchValue = true;
                        temp.Clear();

                        index++;
                        continue;
                    }
                    else if (symbol is '=' & dictionaryMode)
                    {
                        value.Add(temp.ToString(), "nope");
                        searchValue = true;
                        dictionaryMode = false;
                        temp.Clear();

                        index++;
                        continue;
                    }

                    if (symbol is '{')
                    {
                        value = new Dictionary<string, string>();
                        dictionaryMode = true;
                        temp.Clear();

                        index++;
                        continue;
                    }

                    if (symbol is ',' & searchValue)
                    {
                        value[value.Keys.ElementAt(^1)] = temp.ToString();
                        searchValue = false;
                        temp.Clear();

                        index++;
                        continue;
                    }

                    if (symbol is '}')
                    {
                        break;
                    }

                    temp.Append(symbol);
                    index++;
                }

                variables.Add(name, value);
                name = "nope";
                value = "nope";
                temp.Clear();
            }

            return variables;
        }
    }
}
