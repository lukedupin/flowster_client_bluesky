from django.db import models
from django.contrib import admin
import uuid
from flowster.core import util


class Category(models.Model):
    id = models.AutoField(primary_key=True)
    uid = models.UUIDField(default=uuid.uuid4, editable=False)

    sections = models.ManyToManyField('Section')
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    active = models.BooleanField(default=True)

    timestamp_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'website'

    def __str__(self):
        return self.name

    def toJson(self):
        return {
            'uid': util.xstr(self.uid),
            'name': util.xstr(self.name),
            'description': util.xstr(self.description),
            'active': util.xbool(self.active),
            'timestamp_on': self.timestamp_on.isoformat(),
        }

    @staticmethod
    def customAdmin():
        class Admin(admin.ModelAdmin):
            list_display = ('name', 'timestamp_on')
            search_fields = ('name', 'description')
            readonly_fields = ('uid', 'timestamp_on')
            fields = ('name', 'description', 'active', 'timestamp_on')

        return Admin
