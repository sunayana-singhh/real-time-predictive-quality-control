using System;
using System.Collections.Generic;

namespace IntelliInspect.Backend.Models
{
    public class DatasetRecord
    {
        public int Id { get; set; }
        public DateTime SyntheticTimestamp { get; set; }
        public int Response { get; set; }
        public Dictionary<string, double> Features { get; set; } = new();
    }
}
