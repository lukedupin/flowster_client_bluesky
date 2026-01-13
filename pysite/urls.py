from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from website.admin import admin_site
 
admin.autodiscover()

urlpatterns = [
    path('admin/', admin_site.urls),
]
