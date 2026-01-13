from asgiref.sync import sync_to_async
from django.db import models
from django.contrib import admin
import uuid
from flowster.core import util
from website.models.chat_session import ChatSession


class Prompt(models.Model):
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
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    contexts = models.ManyToManyField('Context')

    uid = models.UUIDField(default=uuid.uuid4, editable=False)
    type = models.IntegerField(choices=TYPE_CHOICES, default=DEFAULT_TYPE)
    content = models.TextField()

    extra = models.JSONField(blank=True, default=dict, help_text='Holds things like thinking or tool info')

    timestamp_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'website'

    def __str__(self):
        return f"{self.get_type_display()} Prompt: {self.content[:30]}"

    @staticmethod
    async def create(**kwargs):
        return await sync_to_async( Prompt.objects.create )( **kwargs )

    def toJson(self):
        return {
            'uid': str(self.uid),
            'type': self.get_type_display(),
            'content': util.xstr(self.content),
            'extra': self.extra,
            'timestamp_on': self.timestamp_on.isoformat(),
        }

    @staticmethod
    def customAdmin():
        class Admin(admin.ModelAdmin):
            list_display = ('type', 'timestamp_on')
            list_filter = ('type',)
            search_fields = ('content',)
            readonly_fields = ('uid', 'timestamp_on')
            fields = ('type', 'content', 'extra', 'timestamp_on')

        return Admin
