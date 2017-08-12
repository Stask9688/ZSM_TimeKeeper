from datetime import datetime
import random
from array import array

from django.shortcuts import render, HttpResponse, redirect
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from .models import Project, Timecard, Client, ProjectTask, UserProfile
from django.contrib.auth.models import User
from reportlab.pdfgen import canvas
from django.core import serializers
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import logout
import logging
from io import BytesIO
from django.shortcuts import render, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.forms.models import inlineformset_factory
from django.core.exceptions import PermissionDenied
import time
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from timekeeper import static
from itertools import chain
import json
from django.db import transaction
from django.contrib import messages


def check_permission(user):
    if user.groups.filter(name="Employee").exists() or len(user.groups.all()) == 0:
        return False
    return True


def logout_view(request):
    logout(request)
    return render(request, "admin/login.html")


@login_required
def home(request):
    latest_timecards = Timecard.objects.order_by('-timecard_date')[:7]
    projects = Project.objects.all().order_by('pk')
    context = {'latest_timecards': latest_timecards, 'projects': projects}
    if request.user.groups.filter(name="Manager").exists() \
            or request.user.groups.filter(name="Owner").exists():
        return redirect("/admin")
    elif request.user.groups.filter(name="Employee").exists():
        return redirect("/admin/timekeeper/timecard")
    elif request.user.groups.filter(name="HR").exists():
        return redirect("/admin")
    else:
        return redirect("/logout")


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
    timecard_object = Timecard.objects.filter(timecard_owner=user_object).order_by("-timecard_date")
    project_object = Project.objects.all()
    project_task_object = ProjectTask.objects.all()
    invalid_charge = False
    if 'submit' in request.GET:
        user = User.objects.get(username=request.user.get_username())
        print(request.GET)
        project = Project.objects.get(project_name=request.GET.get('project'))
        print("Charge", request.GET.get('charge'))
        task = ProjectTask.objects.get(project_task_title=request.GET.get('task'))
        if request.GET.get('charge') and project.flat_rate is True:
            invalid_charge = True
            return render(request, "timecard.html", {'invalid_charge': invalid_charge, 'project': project_object,
                                                     "timecard": timecard_object})
        else:
            temp_card = Timecard(timecard_owner=user, timecard_project=project,
                                 timecard_task=task,
                                 timecard_date=request.GET.get('date'),
                                 timecard_hours=request.GET.get('hours'),
                                 timecard_charge=request.GET.get('charge'))
            temp_card.save()
            return render(request, "timecard.html", {'invalid_charge': invalid_charge, 'project': project_object,
                                                     "timecard": timecard_object})

    return render(request, "timecard.html", {'project': project_object,
                                             "timecard": timecard_object,
                                             "tasks": project_task_object})


@user_passes_test(check_permission)
@login_required
def project_detail(request, project_pk):
    project = Project.objects.filter(pk=project_pk)
    tasks = ProjectTask.objects.filter(project_task_link=project)
    timecards = Timecard.objects.filter(timecard_project=project)
    task_totals = {}
    task_total_hours = {}
    relevant_users = []
    min_date = datetime.strptime("2017-01-01", "%Y-%d-%M")
    max_date = datetime.strptime("2017-01-01", "%Y-%d-%M")

    if timecards is not None:
        min_date = timecards[0].timecard_date
        max_date = timecards[0].timecard_date

    for tc in timecards:
        if tc.timecard_date > max_date:
            max_date = tc.timecard_date

        if tc.timecard_date < min_date:
            min_date = tc.timecard_date

        temp_task = tc.project_task.project_task_title
        print(temp_task)
        if temp_task not in task_totals.keys():
            task_totals[temp_task] = tc.timecard_hours * \
                                     tc.timecard_charge
            task_total_hours[temp_task] = tc.timecard_hours
        else:
            task_totals[temp_task] = \
                task_totals[temp_task] + tc.timecard_hours * tc.timecard_charge
            task_total_hours[temp_task] = \
                task_total_hours[temp_task] + tc.timecard_hours
        relevant_users.append(tc.timecard_owner)
    relevant_users = set(relevant_users)
    user_profiles = UserProfile.objects.filter(user__in=relevant_users)
    print(user_profiles)
    for task in tasks:
        if task not in task_totals.keys():
            task_totals[task] = 0
            task_total_hours[task] = 0

    return render(request, "project_detail.html", {"project": project,
                                                   "tasks": tasks,
                                                   "totals": task_totals,
                                                   "hours": task_total_hours,
                                                   "timecards": timecards,
                                                   "users": relevant_users,
                                                   "profiles": user_profiles,
                                                   "minDate": min_date.isoformat(),
                                                   "maxDate": max_date.isoformat()})


@user_passes_test(check_permission)
@login_required
def client_detail(request, client_pk):
    client = Client.objects.get(pk=client_pk)
    projects = Project.objects.filter(client=client_pk)
    project_timecards = Timecard.objects.filter(timecard_project__in=projects)
    projects_running_cost = {}
    users_on_project = []
    for timecard in project_timecards:
        if timecard.timecard_owner.pk not in users_on_project:
            users_on_project.append(timecard.timecard_owner)
    user_profiles = UserProfile.objects.filter(user__in=users_on_project)
    print(user_profiles)
    for project in projects:
        timecards = Timecard.objects.filter(timecard_project=project)
        for tc in timecards:
            if project not in projects_running_cost.keys():
                projects_running_cost[project] = tc.timecard_hours * tc.timecard_charge
            else:
                projects_running_cost[project] = projects_running_cost[project] + \
                                                 tc.timecard_hours * tc.timecard_charge
    project_tasks = ProjectTask.objects.filter(project_task_link__in=projects)

    return render(request, "client_detail.html",
                  {"client": client, "projects": projects, "charges": projects_running_cost,
                   "timecards": project_timecards, "profile": user_profiles, "user": users_on_project,
                   "tasks": project_tasks})


@user_passes_test(check_permission)
@login_required
def projects(request):
    project_object = Project.objects.all()
    timecard_object = Timecard.objects.all()
    if request.user.groups.filter(name="Manager").exists():
        project_object = project_object.filter(employees__username=request.user)
    print("Value: ", timecard_object[0].timecard_expenditure)

    users_on_project = []
    for timecard in timecard_object:
        if timecard.timecard_owner.pk not in users_on_project:
            users_on_project.append(timecard.timecard_owner)
    users_on_project = set(users_on_project)
    user_profile = UserProfile.objects.filter(user__in=users_on_project)
    return render(request, "projects.html",
                  {"projects": project_object, "timecards": timecard_object, "profiles": user_profile})


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
    for project in project_object:
        project_total_time = 0
        timecard_for_project = Timecard.objects.filter(timecard_project=project)
        for timecard in timecard_for_project:
            project_total_time += timecard.timecard_hours
        Project.objects.filter(project_name=project).update(project_hours=project_total_time)
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
    this_user = User.objects.get(username=request.user)
    print(this_user.groups.filter(name="Owner"))
    if this_user.groups.filter(name="Owner").exists():
        user_employees = User.objects.all()

    else:
        user_projects = Project.objects.filter(employees__username=request.user)
        user_employees = ()
        if user_projects:
            for project in user_projects:
                user_employees = list(chain(project.employees.all(), user_employees))
        else:
            user_employees = User.objects.none()
        user_employees = set(user_employees)
    return render(request, "employees.html", {"employees": user_employees})


@login_required
@user_passes_test(check_permission)
def employee_detail(request, employee_pk):
    print(request.user)
    employee = User.objects.get(pk=employee_pk)
    employee_timecard = Timecard.objects.filter(timecard_owner=employee)
    profile = UserProfile.objects.filter(user=employee)
    task_data = ProjectTask.objects.all()
    project_object = Project.objects.all().order_by('pk')
    return render(request, "employee_detail.html",
                  {"employee": employee, "timecard": employee_timecard,
                   "project": project_object, "task": task_data,
                   "profile": profile})


@login_required
def pdfgenerate(request):
    # Create the HttpResponse object with the appropriate PDF headers.
    pk1 = request.GET.get('project', '')
    start = request.GET.get('start', '')
    end = request.GET.get('end', '')
    print(pk1)
    print(start)
    print(end)
    project = Project.objects.get(pk=pk1)
    tasks = ProjectTask.objects.filter(project_task_link=project)
    response = HttpResponse(content_type='application/pdf')
    timecards = Timecard.objects.filter(timecard_project=pk1, timecard_date__range=(start, end))
    print(timecards)
    response['Content-Disposition'] = 'attachment; filename="SampleInvoice.pdf"'
    pdfmetrics.registerFont(TTFont('Vera', 'Vera.ttf'))
    buffer = BytesIO()
    task_totals = {}
    labor_totals = {}
    expenditure_totals = {}
    task_total_hours = {}
    total_cost = 0
    for tc in timecards:
        if tc.project_task not in task_totals.keys():
            task_totals[tc.project_task] = tc.timecard_hours * \
                                           tc.timecard_owner.profile.hourly
            task_total_hours[tc.project_task] = tc.timecard_hours
            labor_totals[tc.project_task] = tc.timecard_hours * \
                                            tc.timecard_owner.profile.hourly
            expenditure_totals[tc.project_task] = tc.timecard_expenditure
        else:

            task_totals[tc.project_task] = \
                task_totals[
                    tc.project_task] + tc.timecard_hours * tc.timecard_owner.profile.hourly + tc.timecard_expenditure
            task_total_hours[tc.project_task] = \
                task_total_hours[tc.project_task] + tc.timecard_hours
            labor_totals[tc.project_task] = labor_totals[tc.project_task] + tc.timecard_hours * \
                                                                            tc.timecard_owner.profile.hourly
            expenditure_totals[tc.project_task] = expenditure_totals[tc.project_task] + tc.timecard_expenditure
        print("task totals: ",task_totals)
    # Create the PDF object, using the BytesIO object as its "file."
    p = canvas.Canvas(buffer)
    i = 0
    totaltasks = 0
    # keeps counter of tasks
    while i < len(tasks):
        i += 1
        totaltasks += 1
    i = 0
    while i < totaltasks:
        try:
            print("tasks",tasks)
            print("task_totals",task_totals)
            print("third: ",task_totals[tasks[i]])
            total_cost += task_totals[tasks[i]]
        except:
            i += i
        i += 1
    # Draw things on the PDF. Here's where the PDF generation happens.
    # See the ReportLab documentation for the full list of functionality.
    p.line(0, 800, 800, 800)
    p.line(0, 50, 800, 50)
    # Header
    p.drawString(40, 815, "ZSM Timekeeper")
    # Bill To Section
    p.setFont('Vera', 16)
    p.drawString(25, 750, "BILL TO: ")
    p.setFont('Vera', 12)
    p.drawString(40, 735, str(project.client))
    p.drawString(40, 720, str(project.client.email))
    p.drawString(40, 705, str(project.client.phone_number))

    # Horizontol Chart
    p.setFont('Vera', 14)
    p.drawString(40, 670, "Project Title: ")
    p.setFont('Vera', 12)
    p.drawString(130, 670, str(project.project_name))
    p.setFont('Vera', 10)
    p.line(40, 660, 560, 660)
    p.line(40, 600, 560, 600)
    p.line(40, 660, 40, 600)
    # Box 1
    p.drawString(78, 650, "Invoice No.")
    p.drawString(78, 610, str(random.randint(0, 99999999)))
    p.line(560, 660, 560, 600)
    # box 2
    p.drawString(210, 650, "Invoice Date")
    p.drawString(210, 610, time.strftime("%m/%d/%Y"))
    p.line(170, 660, 170, 600)
    # box 3
    p.drawString(340, 650, "Project No.")
    p.drawString(355, 610, str(pk1))
    p.line(300, 660, 300, 600)
    # box 4
    p.drawString(460, 650, "Project Charges")
    p.drawString(485, 610, "$" + str(total_cost))
    p.line(430, 660, 430, 600)

    p.setFont('Vera', 11)
    p.drawString(40, 540, "Project Task")
    p.drawString(200, 540, "Project Hours")
    p.drawString(300, 540, "Labor")
    p.drawString(375, 540, "Material")
    p.drawString(470, 540, "Total Charges")
    p.line(40, 530, 560, 530)
    p.setFont('Vera', 10)
    i = 0
    position = 515
    while i != totaltasks:
        p.setFont('Vera', 10)
        p.drawString(40, position, str(tasks[i].project_task_title))
        p.drawString(200, position, str(task_total_hours[tasks[i]]))
        p.drawString(300, position, "$" + str(labor_totals[tasks[i]]) + "0")
        p.drawString(375, position, "$" + str(expenditure_totals[tasks[i]]) + ".00")
        p.drawString(500, position, "$" + str(task_totals[tasks[i]]) + "0")
        position = position - 20
        i += 1
    pnum = p.getPageNumber()
    p.drawString(500, 25, "Page " + str(pnum))
    # New Page
    p.showPage()

    # Graph Inputs
    pnum = p.getPageNumber()
    p.drawString(500, 25, "Page " + str(pnum))

    # Compiles the PDF
    p.save()

    # Get the value of the BytesIO buffer and write it to the response.
    pdf = buffer.getvalue()
    buffer.close()
    response.write(pdf)
    return response
