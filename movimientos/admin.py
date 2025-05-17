from django.contrib import admin
from .models import Categoria, Movimiento

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'usuario')
    list_filter = ('tipo', 'usuario')

@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'usuario', 'categoria', 'cantidad', 'descripcion')
    list_filter = ('categoria__tipo', 'fecha', 'usuario')
    date_hierarchy = 'fecha'
