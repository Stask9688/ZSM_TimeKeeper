from django.shortcuts import render, HttpResponse
from .models import Project
from django.core import serializers
from django.contrib.auth.decorators import login_required


@login_required
def home(request):
    return render(request, "home.html")


@login_required
def clients(request):
    return render(request, "clients.html")


@login_required
def timecard(request):
    return render(request, "timecard.html")


@login_required
def projects(request):
    return render(request, "projects.html")


@login_required
def project_data(request):
    project_object = Project.objects.all()
    project = serializers.serialize("json", project_object)
    print(project[0])
    return HttpResponse(project, content_type="text")


@login_required
def user(request):
    return render(request, "user.html")
