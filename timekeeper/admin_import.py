from django.contrib import admin
from .models import Project, Client, Timecard, ProjectTask, UserProfile
from django.contrib.auth.models import User
from django.core.urlresolvers import resolve
from django.db.models import Q
from import_export import resources
from import_export.admin import ImportExportActionModelAdmin


class ProjectResource(resources.ModelResource):
    class Meta:
        model = Project


class TimecardResource(resources.ModelResource):
    class Meta:
        model = Timecard
