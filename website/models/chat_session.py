from asgiref.sync import sync_to_async
from django.db import models
from django.contrib import admin
import uuid


class ChatSession(models.Model):
    id = models.AutoField(primary_key=True)

    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    timestamp_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'website'

    def __str__(self):
        return self.name

    @staticmethod
    async def getByUid(uid):
        try:
            return await sync_to_async( ChatSession.objects.get )(uid=uid)
        except ChatSession.DoesNotExist:
            return None

    @staticmethod
    async def getOrCreateByUid(uid, name):
        if (chat_session := await ChatSession.getByUid(uid)) is None:
            chat_session = await sync_to_async( ChatSession.objects.create )(name=name[:255])

        return chat_session

    @staticmethod
    def customAdmin():
        class Admin(admin.ModelAdmin):
            list_display = ('name', 'timestamp_on')
            fields = ('uid', 'name', 'timestamp_on')
            readonly_fields = ('timestamp_on', 'uid')

        return Admin
