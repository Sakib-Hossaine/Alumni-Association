from urllib.parse import quote

from django.core.files.base import ContentFile
from django.core.files.storage import Storage


class DatabaseMediaStorage(Storage):
    def _model(self):
        from alumni.models import MediaAsset

        return MediaAsset

    def exists(self, name):
        return self._model().objects.filter(name=name).exists()

    def _open(self, name, mode="rb"):
        asset = self._model().objects.filter(name=name).first()
        if not asset:
            raise FileNotFoundError(name)
        return ContentFile(asset.content, name=name)

    def _save(self, name, content):
        chunks = content.chunks() if hasattr(content, "chunks") else iter([content.read()])
        data = b"".join(chunks)
        model = self._model()
        model.objects.update_or_create(name=name, defaults={"content": data})
        return name

    def delete(self, name):
        self._model().objects.filter(name=name).delete()

    def url(self, name):
        return f"/media/{quote(name, safe='/')}"
