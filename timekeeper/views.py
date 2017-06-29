from django.shortcuts import render, HttpResponse, redirect
from .models import Project, Timecard, Client, ProjectTasks
from django.contrib.auth.models import User
from django.core import serializers
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import logout
import logging


from itertools import chain
import json



def check_permission(user):
    if user.groups.filter(name="Employee").exists() or len(user.groups.all()) == 0:
        return False
    return True


def logout_view(request):
    logout(request)
    return render(request, "admin/logged_out.html")


@login_required
def home(request):
    latest_timecards = Timecard.objects.order_by('-timecard_date')[:7]
    projects = Project.objects.all().order_by('pk')
    context = {'latest_timecards': latest_timecards, 'projects': projects}
    return render(request, "home.html", context)


@user_passes_test(check_permission)
@login_required
def clients(request):
    if False is check_permission(request.user):
        return redirect("/home")
    clients = Client.objects.all().order_by('last_name')
    projects = Project.objects.all()
    return render(request, "clients.html", {'clients': clients, 'projects': projects})


@login_required
def timecard(request):
    user_object = User.objects.filter(username=request.user.get_username())
    timecard_object = Timecard.objects.filter(timecard_owner=user_object)
    project_object = Project.objects.filter(employees__username=request.user).order_by('pk')
    invalid_charge = False
    if 'submit' in request.GET:
        user = User.objects.get(username=request.user.get_username())
        print(request.GET)
        project = Project.objects.get(project_name=request.GET.get('project'))
        print("Charge", request.GET.get('charge'))
        if request.GET.get('charge') and project.flat_rate is True:
            invalid_charge = True
            return render(request, "timecard.html", {'invalid_charge': invalid_charge, 'project': project_object,
                                                     "timecard": timecard_object})
        else:
            temp_card = Timecard(timecard_owner=user, timecard_project=project,
                                 timecard_date=request.GET.get('date'),
                                 timecard_hours=request.GET.get('hours'),
                                 timecard_charge=request.GET.get('charge'))
            temp_card.save()
            return render(request, "timecard.html", {'invalid_charge': invalid_charge, 'project': project_object,
                                                     "timecard": timecard_object})

    return render(request, "timecard.html", {'project': project_object,
                                             "timecard": timecard_object})


@user_passes_test(check_permission)
@login_required
def project_detail(request, project_pk):
    project = Project.objects.get(pk=project_pk)
    tasks = ProjectTasks.objects.filter(project_task_link=project)
    print(tasks)
    return render(request, "project_detail.html", {"project": project, "tasks", tasks})


@user_passes_test(check_permission)
@login_required
def client_detail(request, client_pk):
    client = Client.objects.get(pk=client_pk)
    projects = Project.objects.filter(client=client_pk)
    print(projects)
    return render(request, "client_detail.html", {"client": client, "projects": projects})


@user_passes_test(check_permission)
@login_required
def projects(request):
    return render(request, "projects.html")


@login_required
def project_from_client(request, client_pk):
    projects_for_client = Project.objects.filter(client=client_pk)

    return HttpResponse(serializers.serialize("json", projects_for_client), content_type="json")


@login_required
def project_detail_dcjs(request, project_pk):
    timecards_for_project = Timecard.objects.filter(timecard_project=project_pk)
    users_on_project = []
    for timecard in timecards_for_project:
        if timecard.timecard_owner.pk not in users_on_project:
            users_on_project.append(timecard.timecard_owner)

    users_for_project = User.objects.filter(username__in=users_on_project).order_by("pk")
    project_detail = Project.objects.filter(pk=project_pk)
    client_info = Client.objects.filter(pk=project_detail[0].client.pk)
    print(client_info)
    print(project_detail[0].client.last_name)
    temp = {"timecards": serializers.serialize("json", timecards_for_project),
            "users": serializers.serialize("json", users_for_project),
            "project": serializers.serialize("json", project_detail),
            "client": serializers.serialize("json", client_info)}

    return HttpResponse(json.dumps(temp), content_type="json")


@login_required
def timecards_by_project(request, project_pk):
    timecards_for_project = Timecard.objects.filter(timecard_project=project_pk)
    temp = {"timecards": serializers.serialize("json", timecards_for_project)}
    return HttpResponse(serializers.serialize("json", timecards_for_project), content_type="json")


@user_passes_test(check_permission)
@login_required
def project_data(request):
    project_object = Project.objects.all()
    project = serializers.serialize("json", project_object)
    return HttpResponse(project, content_type="text")


@login_required
def timecard_data(request):
    project_object = Project.objects.all().order_by('pk')

    user = User.objects.filter(username=request.user.get_username())

    timecard_object = Timecard.objects.filter(timecard_owner=user)

    project_object = Project.objects.all()
    test = {"timecard": serializers.serialize("json", timecard_object),
            "project": serializers.serialize("json", project_object),
            "client": serializers.serialize("json", project_object)}
    return HttpResponse(json.dumps(test), content_type="json")


@login_required
def user(request):
    if False is check_permission(request.user):
        return redirect("/home")
    return render(request, "user.html")


@login_required
@user_passes_test(check_permission)
def employees(request):
    user_projects = Project.objects.filter(employees__username=request.user)
    user_employees = ()
    if user_projects:
        for project in user_projects:
            user_employees = list(chain(project.employees.all(), user_employees))
    else:
        user_employees = User.objects.none()

    return render(request, "employees.html", {"employees": set(user_employees)})


@login_required
@user_passes_test(check_permission)
def employee_detail(request, employee_pk):
    print(request.user)
    employee = User.objects.get(pk=employee_pk)
    employee_timecard = Timecard.objects.filter(timecard_owner=employee)
    project_object = Project.objects.all().order_by('pk')
    return render(request, "employee_detail.html",
                  {"employee": employee, "timecard": employee_timecard, "project": project_object})
