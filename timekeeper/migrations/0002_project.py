# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-06-13 00:14
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timekeeper', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('project_name', models.CharField(max_length=30)),
                ('project_description', models.TextField(max_length=200)),
            ],
        ),
    ]
