# api/models/organization.py
from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=255)
    account = models.CharField(max_length=255)
    website = models.URLField(blank=True, null=True)
    fuel_reimbursement_policy = models.CharField(max_length=255, default='1000')
    speed_limit_policy = models.CharField(max_length=255, default='50 km/h')
    parent_org = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_orgs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def to_dict(self):
        """Convert organization to dictionary format"""
        return {
            'id': self.id,
            'name': self.name,
            'account': self.account,
            'website': self.website,
            'fuelReimbursementPolicy': self.fuel_reimbursement_policy,
            'speedLimitPolicy': self.speed_limit_policy,
            'parentOrg': self.parent_org_id,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at
        }