from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("alumni", "0002_galleryimage"),
    ]

    operations = [
        migrations.CreateModel(
            name="MediaAsset",
            fields=[
                ("name", models.CharField(max_length=500, primary_key=True, serialize=False)),
                ("content", models.BinaryField()),
            ],
        ),
    ]
