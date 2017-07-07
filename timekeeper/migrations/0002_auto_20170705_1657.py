# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-07-05 21:57
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('timekeeper', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='timecard',
            name='project_task',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='timekeeper.ProjectTask'),
        ),
        migrations.AddField(
            model_name='timecard',
            name='timecard_approved',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')], default='Pending', max_length=8),
        ),
    ]
