"""ZSM_TimeKeeper URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from timekeeper import views
from django.conf.urls.static import static
from django.conf import settings
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib.auth.views import login
from django.views.generic import TemplateView
from material.frontend import urls as frontend_urls


urlpatterns = [
                  url(r'^$', views.home),
                  url(r'^login', login, kwargs={'template_name': 'admin/login.html'}, name="login"),
                  url(r'^logout', views.logout_view),

                  url(r'^admin/', admin.site.urls),
                  url(r'^home/', views.home, name="zsm_home"),
                  url(r'^projects/', views.projects),
                  url(r'^clients/', views.clients),
                  url(r'^timecard/', views.timecard),
                  url(r'^user/', views.user),
                  url(r'^employees/', views.employees),
                  url(r'^project_data', views.project_data),
                  url(r'^project_detail/(?P<project_pk>\d+)$', views.project_detail),
                  url(r'^employee_detail/(?P<employee_pk>\d+)$', views.employee_detail),
                  url(r'^client_detail/(?P<client_pk>\d+)$', views.client_detail),
                  url(r'^project_from_client/(?P<client_pk>\d+)$', views.project_from_client),
                  url(r'^project_detail_dcjs/(?P<project_pk>\d+)$', views.project_detail_dcjs),
                  url(r'^timecard_data', views.timecard_data),
                  url(r'^pdfgenerate/(?P<project_pk>\d+)$', views.pdfgenerate),
                  url(r'^chaining/', include('smart_selects.urls')),
                   url(r'^accounts/update/(?P<pk>[\-\w]+)/$', views.edit_user, name='account_update'),
                  url(r'^accounts/profile/', TemplateView.as_view(template_name='profile.html'), name='user_profile'),

              ] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + \
              staticfiles_urlpatterns()
