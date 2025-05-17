from rest_framework import viewsets, permissions
from .models import Categoria, Movimiento
from .serializers import CategoriaSerializer, MovimientoSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo las categorías del usuario que hace la petición
        return Categoria.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Al crear, asociamos siempre al usuario autenticado
        serializer.save(usuario=self.request.user)


class MovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Movimiento.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
