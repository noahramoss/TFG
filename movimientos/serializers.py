from rest_framework import serializers
from .models import Categoria, Movimiento

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        # Incluimos el id, el usuario (clave foránea), nombre y tipo
        fields = ['id', 'usuario', 'nombre', 'tipo']
        read_only_fields = ['usuario']

class MovimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movimiento
        fields = ['id', 'usuario', 'categoria', 'descripcion', 'fecha', 'cantidad']
        read_only_fields = ['usuario']
