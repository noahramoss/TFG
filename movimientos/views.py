# movimientos/views.py
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum

from .models import Categoria, Movimiento
from .serializers import CategoriaSerializer, MovimientoSerializer


class IsAuthenticatedAndOwner(permissions.IsAuthenticated):
    """
    Asegura que el usuario esté autenticado y que filtramos por su propio contenido
    en get_queryset/perform_create.
    """
    pass


class CategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticatedAndOwner]

    def get_queryset(self):
        # Solo categorías del usuario logueado
        return Categoria.objects.filter(usuario=self.request.user).order_by('nombre')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def perform_destroy(self, instance):
        # Bloquea el borrado si tiene movimientos asociados del mismo usuario
        tiene_movs = Movimiento.objects.filter(
            usuario=self.request.user,
            categoria=instance
        ).exists()

        if tiene_movs:
            raise ValidationError(
                'No puedes borrar esta categoría porque tiene movimientos asociados. '
                'Primero reasigna o elimina esos movimientos.'
            )

        instance.delete()


class MovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [IsAuthenticatedAndOwner]

    def get_queryset(self):
        """
        Filtra por usuario y acepta query params:
          - categoria: id numérico de categoría
          - tipo: 'ingreso' | 'gasto'
          - date_from: 'YYYY-MM-DD'
          - date_to:   'YYYY-MM-DD'
        """
        qs = Movimiento.objects.filter(usuario=self.request.user).order_by('-fecha', '-id')

        categoria = self.request.query_params.get('categoria')
        tipo = self.request.query_params.get('tipo')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if categoria:
            qs = qs.filter(categoria_id=categoria)

        if tipo in ('ingreso', 'gasto'):
            qs = qs.filter(categoria__tipo=tipo)

        if date_from:
            qs = qs.filter(fecha__gte=date_from)

        if date_to:
            qs = qs.filter(fecha__lte=date_to)

        return qs

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        Devuelve totales y desglose por categoría, respetando los mismos filtros
        (categoria, tipo, date_from, date_to) aplicados en get_queryset.
        """
        qs = self.get_queryset()
        total_ingresos = qs.filter(categoria__tipo='ingreso').aggregate(total=Sum('cantidad'))['total'] or 0
        total_gastos = qs.filter(categoria__tipo='gasto').aggregate(total=Sum('cantidad'))['total'] or 0

        por_categoria = qs.values('categoria', 'categoria__nombre', 'categoria__tipo') \
                          .annotate(total=Sum('cantidad')) \
                          .order_by('-total')

        return Response({
            'total_ingresos': total_ingresos,
            'total_gastos': total_gastos,
            'balance': (total_ingresos - total_gastos),
            'por_categoria': list(por_categoria),
        })
