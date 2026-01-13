from django.db import models
from django.contrib import admin
from website.models.chat_session import ChatSession
import uuid
from flowster.core import util

class Context(models.Model):
    TYPE_USER = 1
    TYPE_ASSISTANT = 2
    TYPE_TOOL = 3
    TYPE_CHOICES = [
        (TYPE_USER, 'User'),
        (TYPE_ASSISTANT, 'Assistant'),
        (TYPE_TOOL, 'Tool'),
    ]
    DEFAULT_TYPE = TYPE_USER

    id = models.AutoField(primary_key=True)

    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='contexts')
    prompts = models.ManyToManyField('Prompt')

    uid = models.UUIDField(default=uuid.uuid4, editable=False)
    type = models.IntegerField(choices=TYPE_CHOICES, default=DEFAULT_TYPE)
    name = models.CharField(max_length=255)
    content = models.TextField()

    timestamp_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'website'

    def __str__(self):
        return f"{self.get_type_display()} Context: {self.name}"

    def toJson(self):
        return {
            'uid': util.xstr(self.uid),
            'type': self.get_type_display(),
            'name': util.xstr(self.name),
            'content': util.xstr(self.content),
            'timestamp_on': self.timestamp_on.isoformat(),
        }

    @staticmethod
    def customAdmin():
        class Admin(admin.ModelAdmin):
            list_display = ('type', 'name', 'timestamp_on')
            list_filter = ('type',)
            search_fields = ('name', 'content')

        return Admin
