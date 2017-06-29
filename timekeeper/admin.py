from django.contrib import admin
from .models import Project, Client, Timecard, ProjectTasks


class ProjectDetail(admin.ModelAdmin):
    list_display = ("project_name", "project_description", "client",
                    "running_cost", "flat_rate")
    filter_horizontal = ('employees',)


class ClientDetail(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "phone_number")


class TimecardDetail(admin.ModelAdmin):
    list_display = ("timecard_owner", "timecard_project",
                    "timecard_date", "timecard_hours")

class ProjectTasksDetail(admin.ModelAdmin):
    list_display = ("project_task_link", "project_task_description",
                    "project_task_title", "project_task_hours_remaining")


admin.site.register(Project, ProjectDetail)
admin.site.register(Client, ClientDetail)
admin.site.register(Timecard, TimecardDetail)
admin.site.register(ProjectTasks, ProjectTasksDetail)
