from django.shortcuts import render, HttpResponse
from .models import Project
from django.core import serializers


# Create your views here.
def home(request):
    return render(request, "home.html")


def clients(request):
    return render(request, "clients.html")


def timecard(request):
    return render(request, "timecard.html")


def projects(request):
    return render(request, "projects.html")


def project_data(request):
    project_object = Project.objects.filter(project_name=request.GET["name"])
    project = serializers.serialize("json", project_object)
    print(project[0])
    return HttpResponse(project, content_type="text")
