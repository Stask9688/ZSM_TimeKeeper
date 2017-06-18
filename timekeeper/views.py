from django.shortcuts import render, HttpResponse
from .models import Project, Timecard, Client
from django.contrib.auth.models import User
from django.core import serializers
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
import logging
import simplejson


def logout_view(request):
    logout(request)
    return render(request, "admin/logged_out.html")

@login_required
def home(request):
    latest_timecards = Timecard.objects.order_by('-timecard_date')[:7]
    projects = Project.objects.all().order_by('pk')
    context = {'latest_timecards': latest_timecards,'projects':projects}
    return render(request, "home.html", context)


@login_required
def clients(request):
    clients = Client.objects.all().order_by('last_name')
    return render(request, "clients.html", {'clients': clients})


@login_required
def timecard(request):
    user = User.objects.filter(username=request.user.get_username())
    timecard_object = Timecard.objects.filter(timecard_owner=user)
    project_object = Project.objects.all().order_by('pk')
    if 'submit' in request.GET:
        user = User.objects.get(username=request.user.get_username())
        logging.debug(request.GET.get('project'))
        logging.debug(request.GET.get('date'))
        logging.debug(request.GET.get('hours'))
        print(request.GET)
        project = Project.objects.get(project_name=request.GET.get('project'))

        timecard = Timecard(timecard_owner=user, timecard_project=project,
                            timecard_date=request.GET.get('date'), timecard_hours=request.GET.get('hours'))
        timecard.save()
    return render(request, "timecard.html", {'project': project_object, "timecard": timecard_object})


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
def timecard_data(request):
    project_object = Project.objects.all().order_by('pk')

    user = User.objects.filter(username=request.user.get_username())

    timecard_object = Timecard.objects.filter(timecard_owner=user)

    timecard = serializers.serialize("json", timecard_object)
    project = serializers.serialize("json", project_object)
    test = {"timecard": timecard, "project": project}
    print(test)
    return HttpResponse(simplejson.dumps(test), content_type="json")


@login_required
def user(request):
    return render(request, "user.html")
