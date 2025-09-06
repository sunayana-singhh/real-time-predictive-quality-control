using IntelliInspect.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace IntelliInspect.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<DatasetRecord> DatasetRecords { get; set; }
    }
}

