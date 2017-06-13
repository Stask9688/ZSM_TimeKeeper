from django.contrib import admin
from .models import Project, Client


class ProjectDetail(admin.ModelAdmin):
    list_display = ("project_name", "project_description")


class ClientDetail(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "phone_number")


admin.site.register(Project, ProjectDetail)
admin.site.register(Client, ClientDetail)
