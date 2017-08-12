from django.contrib import admin
from .models import Project, Client, Timecard, ProjectTask, UserProfile
from django.contrib.auth.models import User
from django.core.urlresolvers import resolve
from django.db.models import Q
from import_export.admin import ImportExportActionModelAdmin
from .admin_import import ProjectResource, TimecardResource, UserProfileResource, \
    ClientProfileResource, ProjectTaskResource, UserResource


class User(ImportExportActionModelAdmin):
    resource_class = UserResource

class ProjectDetail(ImportExportActionModelAdmin):
    list_display = ("project_name", "project_description", "client",
                    "running_cost", "flat_rate")
    filter_horizontal = ('employees',)
    search_fields = ['project_name', 'project_description', 'client__first_name', 'client__last_name']
    resource_class = ProjectResource


class UserProfileDetail(ImportExportActionModelAdmin):
    list_display = (
        "user", "birthdate", "address", "city", "state", "zip", "phone", "ssn", "bank", "account", "routing", "hourly")

    search_fields = ['user__username']

    resource_class = UserProfileResource

    def get_readonly_fields(self, request, obj=None):
        if obj and request.user.groups.filter(name="Employee").exists():  # when editing an object
            return ['user', 'ssn', 'birthdate', 'hourly']
        return self.readonly_fields

    def get_queryset(self, request):
        print(request.user)
        if request.user.groups.filter(name="Employee").exists():
            return UserProfile.objects.filter(user=request.user)
        else:
            return UserProfile.objects.all()


class ClientDetail(ImportExportActionModelAdmin):
    search_fields = ['last_name', 'first_name', 'email', 'phone_number']
    list_display = ("last_name", "first_name", "email", "phone_number")
    resource_class = ClientProfileResource


class TimecardDetail(ImportExportActionModelAdmin):
    list_display = ("timecard_owner", "timecard_project", 'project_task',
                    "timecard_date", "timecard_hours", "timecard_approved")

    search_fields = ['timecard_owner__username', 'timecard_project__project_name',
                     'project_task__project_task_title']

    resource_class = TimecardResource

    def has_change_permission(self, request, obj=None):
        if obj is None:
            return True

        if obj.timecard_approved != "Pending" and request.user.groups.filter(name="Employee").exists():
            return False

        if obj.timecard_approved != "Pending" and request.user.groups.filter(name="Manager").exists() and \
                        request.user == obj.timecard_owner:
            return False
        return True

    def formfield_for_choice_field(self, db_field, request, **kwargs):

        print(db_field.name)
        if db_field.name == "timecard_approved" and request.user.groups.filter(name="Employee").exists():
            return
        kwargs['choices'] = (("Pending", "Pending"), ("Approved", "Approved"), ("Rejected", "Rejected"),)
        return db_field.formfield(**kwargs)

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
        if request.user.groups.filter(name="Employee").exists():
            return Timecard.objects.filter(timecard_owner=request.user)
        if request.user.groups.filter(name="Manager").exists():
            project_object = Project.objects.filter(employees__username=request.user)
            project_names = []
            for project in project_object:
                project_names.append(project)
            return Timecard.objects.filter(Q(timecard_owner=request.user) | Q(timecard_project__in=project_names))
        return Timecard.objects.all()


class ProjectTaskDetail(ImportExportActionModelAdmin):
    list_display = ("project_task_link", "project_task_title",
                    "project_task_description", "project_task_hours_remaining")

    search_fields = ['project_task_link__project_name', 'project_task_title',
                     'project_task_description']

    resource_class = ProjectTaskResource

    def get_queryset(self, request):
        project_object = Project.objects.filter(employees__username=request.user)
        print(project_object)
        project_name = []
        for project in project_object:
            project_name.append(project)
        project_task_object = ProjectTask.objects.filter(project_task_link__in=project_name)
        print(project_task_object)
        return project_task_object


# class UserDe

admin.site.register(Project, ProjectDetail)
admin.site.register(Client, ClientDetail)
admin.site.register(Timecard, TimecardDetail)
admin.site.register(ProjectTask, ProjectTaskDetail)
admin.site.register(UserProfile, UserProfileDetail)
