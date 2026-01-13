from django.contrib import admin
from django.contrib.auth import models as auth_models
from django.contrib.auth import admin as auth_admin

# Register your models here.
class MyAdminSite( admin.AdminSite ):
    # Text to put at the end of each page's <title>.
    site_title = 'Flowster Super Admin'

    # Text to put in each page's <h1>.
    site_header = 'Flowster Chat'

    # Text to put at the top of the admin index page.
    index_title = 'Flowster Chat Super admin'


# Register admin
from website.models import *

admin_site = MyAdminSite()
admin_site.register(auth_models.User,   auth_admin.UserAdmin)
admin_site.register(auth_models.Group,  auth_admin.GroupAdmin)

for klass in (Category, ChatSession, Context, Section, Prompt):
    admin_site.register( klass, klass.customAdmin())
