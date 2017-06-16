from django.shortcuts import render, HttpResponse
from .models import Project, Timecard
from django.core import serializers
from django.contrib.auth.decorators import login_required
import logging


@login_required
def home(request):
    latest_timecards = Timecard.objects.order_by('timecard_date')[:7]
    context = {'latest_timecards': latest_timecards}
    return render(request, "home.html", context)


@login_required
def clients(request):
    return render(request, "clients.html")


@login_required
def timecard(request):
    if 'submit' in request.GET:
        logging.debug(request.GET.get('project'))
        logging.debug(request.GET.get('date'))
        logging.debug(request.GET.get('hours'))
        timecard = Timecard.create("USER", request.GET.get('project'),
                                   request.GET.get('date'), request.GET.get('hours'))
        timecard.save()
    return render(request,"timecard.html")


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
