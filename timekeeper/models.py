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

