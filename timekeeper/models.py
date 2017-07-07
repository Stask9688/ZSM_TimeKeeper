from django.db import models
from django.contrib.auth.models import User
from smart_selects.db_fields import ChainedForeignKey


# Create your models here.
class Client(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField()
    phone_number = models.CharField(max_length=14)

    def __str__(self):
        return self.first_name + " " + self.last_name


class Project(models.Model):
    project_name = models.CharField(max_length=30)
    project_description = models.TextField(max_length=200)
    project_hours = models.IntegerField(default=0)
    client = models.ForeignKey(Client, null=True)
    flat_rate = models.BooleanField(default=False)
    running_cost = models.FloatField(default=0)
    employees = models.ManyToManyField(User, related_name="employees")

    def __str__(self):
        return self.project_name


class ProjectTask(models.Model):
    project_task_link = models.ForeignKey(Project, related_name="tasks")
    project_task_title = models.CharField(max_length=50)
    project_task_description = models.CharField(max_length=200)
    project_task_hours_remaining = models.IntegerField()

    def __str__(self):
        return self.project_task_title


# Timecard object contains the owner(a.k.a current user),
# the project of the timecard, the date of the timecard,
# and the amount of hours worked. Create instantiates
# the timecard object.
class Timecard(models.Model):
    P = "Pending"
    A = "Approved"
    R = "Rejected"
    approval_choices = ((P, "Pending"), (A, "Approved"), (R, "Rejected"),)
    timecard_owner = models.ForeignKey(User, null=True)
    timecard_project = models.ForeignKey(Project, null=False, default=1)
    project_task = ChainedForeignKey(ProjectTask,
                                     chained_field="timecard_project",
                                     chained_model_field="project_task_link",
                                     show_all=False,
                                     auto_choose=True,
                                     sort=True)
    timecard_date = models.DateField()
    timecard_hours = models.IntegerField(default=0)
    timecard_charge = models.FloatField(default=0)
    timecard_approved = models.CharField(max_length=8, choices=approval_choices, default="Pending")
