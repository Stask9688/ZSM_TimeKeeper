from django.shortcuts import render


# Create your views here.
def home(request):
    return render(request, "home.html")

def clients(request):
    return render(request,"clients.html")

def timecard(request):
    return render(request,"timecard.html")

def projects(request):
    return render(request,"projects.html")