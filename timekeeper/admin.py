from django.contrib import admin
from .models import Project, Client, Timecard, ProjectTask
from django.contrib.auth.models import User
from django.core.urlresolvers import resolve


class ProjectDetail(admin.ModelAdmin):
    list_display = ("project_name", "project_description", "client",
                    "running_cost", "flat_rate")
    filter_horizontal = ('employees',)


class ClientDetail(admin.ModelAdmin):
    list_display = ("last_name", "first_name", "email", "phone_number")


class TimecardDetail(admin.ModelAdmin):
    list_display = ("timecard_owner", "timecard_project", 'project_task',
                    "timecard_date", "timecard_hours", "timecard_approved")


    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True

        if obj.timecard_approved != "Pending" and request.user.groups == "Employee":
            return False

        if obj.timecard_approved != "Pending" and request.user.groups.filter(name="Manager").exists() and \
                        request.user == obj.timecard_owner:
            return False
        return True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "timecard_owner":
            if request.user.groups.filter(name="Employee").exists():
                print(request.user)
                kwargs["queryset"] = \
                    User.objects.filter(username=request.user)

        if db_field.name == "project_task":
            print(resolve(request.path_info).args)
            print(resolve(request.path_info).args is ())
            if resolve(request.path_info).args is ():
                return super(TimecardDetail, self).formfield_for_foreignkey(db_field, request, **kwargs)

            timecard_object = Timecard.objects.get(pk=resolve(request.path_info).args[0])
            project_task_object = ProjectTask.objects.filter(project_task_link=timecard_object.timecard_project)

            kwargs["queryset"] = project_task_object

        return super(TimecardDetail, self).formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        print(request.user)
        if not request.user.is_superuser:
            return Timecard.objects.filter(timecard_owner=request.user)
        return Timecard.objects.all()


class ProjectTaskDetail(admin.ModelAdmin):
    list_display = ("project_task_link", "project_task_title",
                    "project_task_description", "project_task_hours_remaining")


admin.site.register(Project, ProjectDetail)
admin.site.register(Client, ClientDetail)
admin.site.register(Timecard, TimecardDetail)
admin.site.register(ProjectTask, ProjectTaskDetail)
