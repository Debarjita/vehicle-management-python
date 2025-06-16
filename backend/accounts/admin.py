from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User

class UserAdmin(BaseUserAdmin):
    # ✅ This shows 'role' in list and form views
    fieldsets = BaseUserAdmin.fieldsets + (
        (_('Role Information'), {'fields': ('role', 'org')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_('Role Information'), {'fields': ('role', 'org')}),
    )
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')

admin.site.register(User, UserAdmin)
