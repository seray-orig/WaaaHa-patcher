namespace WaaaHa__patcher.API.Models
{
    public class HotkeyScheme(string name, float version, Dictionary<string, Dictionary<string, string>> bindings)
    {
        public static string strName = "bindings_locstring";
        public static string strVersion = "bindings_version";

        public static string ConvertName(string text)
        {
            var name = text switch
            {
                "$11271750" => "Классические горячие клавиши",
                "$11271751" => "Пространственная решётка",
                "$11271954" => "Пространственная решётка AZERTY",
                "$11271953" => "Пространственная решётка QWERTZ",
                "$11271752" => "Современные горячие клавиши",

                "Классические горячие клавиши"      => "$11271750",
                "Пространственная решётка"          => "$11271751",
                "Пространственная решётка AZERTY"   => "$11271954",
                "Пространственная решётка QWERTZ"   => "$11271953",
                "Современные горячие клавиши"       => "$11271752",

                _ => text
            };

            return name;
        }

        public string Name
        {
            get;
            set
            {
                field = ConvertName(value);
            }
        } = name;

        public float Version { get; set; } = version;

        public Dictionary<string, Dictionary<string, string>> Bindings { get; init; } = bindings;
    }
}
