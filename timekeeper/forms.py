from django import forms

class TimeCardForm(forms.Form):
    project = forms.CharField(max_length=40)
    task = forms.CharField(max_length= 100)
    date = forms.DateField()
    hours = forms.IntegerField()