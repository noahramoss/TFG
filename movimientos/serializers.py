from rest_framework import serializers
from django.db import IntegrityError
from .models import Categoria, Movimiento

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        # Incluimos el id, el usuario (clave foránea), nombre y tipo
        fields = ['id', 'usuario', 'nombre', 'tipo']
        read_only_fields = ['usuario']

    def validate(self, attrs):
        user = self.context['request'].user
        nombre = attrs.get('nombre') if 'nombre' in attrs else (self.instance and self.instance.nombre)
        tipo = attrs.get('tipo') if 'tipo' in attrs else (self.instance and self.instance.tipo)

        if nombre and tipo:
            qs = Categoria.objects.filter(usuario=user, tipo=tipo, nombre__iexact=str(nombre).strip())
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'nombre': 'Ya existe una categoría con ese nombre y tipo.'})
        return attrs

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        try:
            return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'nombre': 'Ya existe una categoría con ese nombre y tipo.'})

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError({'nombre': 'Ya existe una categoría con ese nombre y tipo.'})

class MovimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movimiento
        fields = ['id', 'usuario', 'categoria', 'descripcion', 'fecha', 'cantidad']
        read_only_fields = ['usuario']
    
    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser positiva (mayor que 0).')
        return value
