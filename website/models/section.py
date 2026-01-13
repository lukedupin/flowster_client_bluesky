from django.db import models
from django.contrib import admin
from website.models.prompt import Prompt
import uuid
from flowster.core import util


class Section(models.Model):
    id = models.AutoField(primary_key=True)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='sections')
    categories = models.ManyToManyField('Category')

    uid = models.UUIDField(default=uuid.uuid4, editable=False)
    content = models.TextField()

    timestamp_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'website'

    def __str__(self):
        return f"Section {self.content[:30]}"

    def toJson(self):
        return {
            'uid': util.xstr(self.uid),
            'content': util.xstr(self.content),
            #'categories': [category.id for category in self.categories.all()],
            'timestamp_on': self.timestamp_on.isoformat(),
        }

    @staticmethod
    def customAdmin():
        class Admin(admin.ModelAdmin):
            list_display = ('id', 'prompt', 'timestamp_on')
            filter_horizontal = ('categories',)
            search_fields = ('content',)
            readonly_fields = ('uid', 'timestamp_on')
            fields = ('prompt', 'content', 'categories', 'timestamp_on')

        return Admin
