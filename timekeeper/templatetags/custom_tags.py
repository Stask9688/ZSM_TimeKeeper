from django import template
from django.contrib.auth.models import Group
from django import template
from django.utils.safestring import mark_safe
from django.core import serializers

register = template.Library()


@register.filter(name='has_group')
def has_group(user, group_name):
    group = Group.objects.get(name=group_name)
    return group in user.groups.all()


@register.filter(name="json_safe")
def as_json(data):
    return mark_safe(serializers.serialize("json", data))
