from django import forms

class TimeCardForm(forms.Form):
    project = forms.CharField(max_length=40)
    date = forms.DateField()
    hours = forms.IntegerField()