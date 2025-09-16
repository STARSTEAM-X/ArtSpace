using System.Text.Json;

namespace MyWebApi.Helpers
{
    public static class ListJsonConverter
    {
        public static List<string> FromJson(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }

        public static string ToJson(List<string> list)
        {
            return JsonSerializer.Serialize(list ?? new List<string>());
        }
    }
}
