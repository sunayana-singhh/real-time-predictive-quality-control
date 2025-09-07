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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure DatasetRecord
            modelBuilder.Entity<DatasetRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SyntheticTimestamp).IsRequired();
                entity.Property(e => e.Response).IsRequired();
                entity.Property(e => e.FeaturesJson).HasColumnType("TEXT");
                
                // Explicitly ignore the Features property (it's already NotMapped)
                entity.Ignore(e => e.Features);
            });
        }
    }
}
