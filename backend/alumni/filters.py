import django_filters
from .models import AlumniProfile, Batch
class AlumniFilter(django_filters.FilterSet):
    batch = django_filters.ModelChoiceFilter(queryset=Batch.objects.all())
    class Meta: model = AlumniProfile; fields = {"graduation_year": ["exact", "gte", "lte"], "gender": ["exact"]}
