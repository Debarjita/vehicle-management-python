from rest_framework import serializers
from accounts.models import User

class UserListSerializer(serializers.ModelSerializer):
    org_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'org', 'org_name']

    def get_org_name(self, obj):
        return obj.org.name if obj.org else None
