from .models import Project, Client, Timecard, ProjectTask, UserProfile
from import_export import resources


class ProjectResource(resources.ModelResource):
    class Meta:
        model = Project


class TimecardResource(resources.ModelResource):
    class Meta:
        model = Timecard


class UserProfileResource(resources.ModelResource):
    class Meta:
        model = UserProfile


class ClientProfileResource(resources.ModelResource):
    class Meta:
        model = Client


class ProjectTaskResource(resources.ModelResource):
    class Meta:
        model = ProjectTask
