# movimientos/views.py
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from .models import Categoria, Movimiento
from .serializers import CategoriaSerializer, MovimientoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Cada usuario solo ve sus categorías
        return Categoria.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Al crear, se asocia al usuario autenticado
        serializer.save(usuario=self.request.user)

    def perform_destroy(self, instance):
        # Bloquear borrado si hay movimientos asociados del mismo usuario
        tiene_movs = Movimiento.objects.filter(
            usuario=self.request.user,
            categoria=instance
        ).exists()

        if tiene_movs:
            raise ValidationError(
                'No puedes borrar esta categoría porque tiene movimientos asociados. '
                'Primero reasigna o elimina esos movimientos.'
            )

        # Si no tiene movimientos, se puede borrar
        instance.delete()


class MovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Cada usuario solo ve sus movimientos
        return Movimiento.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Se asocia al usuario autenticado
        serializer.save(usuario=self.request.user)
