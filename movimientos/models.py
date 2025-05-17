from django.db import models
from django.conf import settings

class Categoria(models.Model):
    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('gasto', 'Gasto'),
    ]
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categorias'
    )
    nombre = models.CharField(max_length=50)
    tipo = models.CharField(max_length=7, choices=TIPO_CHOICES)

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"


class Movimiento(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='movimientos'
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        related_name='movimientos'
    )
    descripcion = models.CharField(max_length=200, blank=True)
    fecha = models.DateField()
    cantidad = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        signo = '+' if self.categoria and self.categoria.tipo == 'ingreso' else '-'
        return f"{signo}{self.cantidad} — {self.descripcion or 'Sin descripción'}"
