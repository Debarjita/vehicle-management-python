# models.py (add to existing file)
class Vehicle(models.Model):
    vin = models.CharField(max_length=17, unique=True)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='vehicles'
    )
    details = models.JSONField()  # For PostgreSQL. Use TextField for other DBs and handle JSON manually
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        """Convert vehicle to dictionary format"""
        return {
            'id': self.id,
            'vin': self.vin,
            'org': self.org_id,
            'details': self.details,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at
        }