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

@register.filter(name='get_by_index')
def get_by_index(l,i):
    return l[i]

@register.filter
def get_type(value):
    return type(value)

@register.filter
def to_class_name(value):
    return value.__class__.__name__

@register.filter
def get_name(value):
    return value.related_name