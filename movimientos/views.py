# movimientos/views.py
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth

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
        qs = Categoria.objects.filter(usuario=self.request.user).order_by('nombre')

        # Permitir filtro por tipo en la API: ?tipo=ingreso|gasto
        tipo = self.request.query_params.get('tipo')
        if tipo in ('ingreso', 'gasto'):
            qs = qs.filter(tipo=tipo)

        return qs

    def perform_create(self, serializer):
        """
        Crea la categoría para el usuario autenticado.
        Valida duplicados (usuario + tipo + nombre) sin distinguir mayúsculas.
        """
        user = self.request.user
        nombre = str(serializer.validated_data.get('nombre', '')).strip()
        tipo = serializer.validated_data.get('tipo')

        # Bloqueo de duplicados case-insensitive
        if Categoria.objects.filter(usuario=user, tipo=tipo, nombre__iexact=nombre).exists():
            raise ValidationError({'nombre': 'Ya existe una categoría con ese nombre y tipo.'})

        serializer.save(usuario=user, nombre=nombre)

    def perform_update(self, serializer):
        """
        Evita que al editar se renombre a un duplicado.
        """
        user = self.request.user
        instance = self.get_object()
        # Tomamos valores nuevos o los actuales si no se actualizan
        nombre = str(serializer.validated_data.get('nombre', instance.nombre)).strip()
        tipo = serializer.validated_data.get('tipo', instance.tipo)

        qs = Categoria.objects.filter(usuario=user, tipo=tipo, nombre__iexact=nombre).exclude(pk=instance.pk)
        if qs.exists():
            raise ValidationError({'nombre': 'Ya existe una categoría con ese nombre y tipo.'})

        serializer.save(nombre=nombre, tipo=tipo)

    def perform_destroy(self, instance):
        """
        Impide borrar si tiene movimientos asociados y devuelve un mensaje con el recuento.
        """
        n = Movimiento.objects.filter(
            usuario=self.request.user,
            categoria=instance
        ).count()

        if n > 0:
            # DRF devolverá {"detail": "..."} con 400
            raise ValidationError(
                f'No se puede eliminar la categoría porque tiene {n} movimiento(s) asociado(s). '
                'Primero reasigna o elimina esos movimientos.'
            )

        # Si no tiene movimientos, borrado estándar
        return super().perform_destroy(instance)


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

    @action(detail=False, methods=['get'], url_path='resumen-mensual')
    def resumen_mensual(self, request):
        """
        Agrupa por mes y devuelve ingresos, gastos y balance por mes.
        Respeta filtros: categoria, tipo, date_from, date_to.
        """
        qs = self.get_queryset()
        agg = (
            qs.annotate(mes=TruncMonth('fecha'))
              .values('mes')
              .annotate(
                  ingresos=Sum('cantidad', filter=Q(categoria__tipo='ingreso')),
                  gastos=Sum('cantidad', filter=Q(categoria__tipo='gasto')),
              )
              .order_by('mes')
        )

        series = []
        for row in agg:
            ing = row['ingresos'] or 0
            gas = row['gastos'] or 0
            series.append({
                'month': row['mes'].strftime('%Y-%m'),
                'ingresos': float(ing),
                'gastos': float(gas),
                'balance': float(ing - gas),
            })

        return Response({'series': series})

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
