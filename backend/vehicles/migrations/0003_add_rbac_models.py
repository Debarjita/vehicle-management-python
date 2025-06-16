# Create this as: backend/vehicles/migrations/0003_add_rbac_models.py

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('vehicles', '0002_entrylog'),
        ('accounts', '0002_user_org_alter_user_role'),
    ]

    operations = [
        # Update Vehicle model
        migrations.RemoveField('vehicle', 'org'),
        migrations.AddField(
            model_name='vehicle',
            name='org',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='vehicles.organization'),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='status',
            field=models.CharField(choices=[('AVAILABLE', 'Available'), ('ASSIGNED', 'Assigned'), ('IN_USE', 'In Use'), ('MAINTENANCE', 'Maintenance')], default='AVAILABLE', max_length=20),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='assigned_driver',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_vehicles', to='accounts.user'),
        ),
        
        # Create Shift model
        migrations.CreateModel(
            name='Shift',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('shift_type', models.CharField(choices=[('GUARD', 'Guard Shift'), ('DRIVER', 'Driver Shift')], max_length=10)),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_active', models.BooleanField(default=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
                ('vehicle', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='vehicles.vehicle')),
                ('org', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='vehicles.organization')),
            ],
            options={
                'unique_together': {('user', 'date', 'shift_type')},
            },
        ),
        
        # Create AttendanceLog model
        migrations.CreateModel(
            name='AttendanceLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('LOGIN', 'Login'), ('LOGOUT', 'Logout')], max_length=10)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('face_image', models.TextField(blank=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.user')),
                ('shift', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='vehicles.shift')),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_attendance', to='accounts.user')),
            ],
        ),
        
        # Create VehicleVerification model
        migrations.CreateModel(
            name='VehicleVerification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('license_plate_image', models.TextField()),
                ('driver_face_image', models.TextField()),
                ('verification_time', models.DateTimeField(auto_now_add=True)),
                ('is_verified', models.BooleanField(default=True)),
                ('vehicle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='vehicles.vehicle')),
                ('driver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vehicle_verifications', to='accounts.user')),
                ('guard', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guard_verifications', to='accounts.user')),
                ('shift', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='vehicles.shift')),
            ],
        ),
    ]