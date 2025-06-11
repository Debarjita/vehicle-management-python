# backend/vehicles/serializers.py
from rest_framework import serializers
from .models import Vehicle, Organization

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class RecursiveOrgSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    resolved_fuel_policy = serializers.SerializerMethodField()
    resolved_speed_policy = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['name', 'account', 'website', 'fuelReimbursementPolicy', 'resolved_fuel_policy', 'speedLimitPolicy', 'resolved_speed_policy', 'children']

    def get_resolved_fuel_policy(self, obj):
        current = obj
        while current:
            if current.fuelReimbursementPolicy:
                return current.fuelReimbursementPolicy
            current = current.parent
        return None

    def get_resolved_speed_policy(self, obj):
        if obj.speedLimitPolicy:
            return obj.speedLimitPolicy
        current = obj.parent
        while current:
            if current.speedLimitPolicy:
                return current.speedLimitPolicy
            current = current.parent
        return None

    def get_children(self, obj):
        children = obj.children.all()
        return RecursiveOrgSerializer(children, many=True).data
