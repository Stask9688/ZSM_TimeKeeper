from django.db import models


# Create your models here.
class Client(models.Model):
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.EmailField()
    phone_number = models.CharField(max_length=14)


class Project(models.Model):
    project_name = models.CharField(max_length=30)
    project_description = models.TextField(max_length=200)

# Timecard object contains the owner(a.k.a current user),
# the project of the timecard, the date of the timecard,
# and the amount of hours worked. Create instantiates
# the timecard object.
class Timecard(models.Model):
    timecard_owner = models.CharField(max_length=50)
    timecard_project = models.CharField(max_length=50)
    timecard_date = models.DateField()
    timecard_hours = models.IntegerField()

    @classmethod
    def create(cls, o, p, d, h):
        timecard_temp = cls(timecard_owner=o, timecard_project=p,
                            timecard_date=d, timecard_hours=h)
        return timecard_temp

