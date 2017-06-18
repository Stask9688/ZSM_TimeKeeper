from django.db import models
from django.contrib.auth.models import User


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

    def __str__(self):
        return self.project_name


# Timecard object contains the owner(a.k.a current user),
# the project of the timecard, the date of the timecard,
# and the amount of hours worked. Create instantiates
# the timecard object.
class Timecard(models.Model):
    timecard_owner = models.ForeignKey(User, null=True)
    timecard_project = models.ForeignKey(Project, null=True)
    timecard_date = models.DateField()
    timecard_hours = models.IntegerField(default=0)
    timecard_charge = models.FloatField(default=0)
