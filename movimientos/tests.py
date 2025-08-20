# movimientos/tests.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from .models import Categoria, Movimiento
from datetime import date, timedelta

class MovimientosApiTests(TestCase):
    def setUp(self):
        self.u = User.objects.create_user(username='test', password='pass123456')
        self.token, _ = Token.objects.get_or_create(user=self.u)
        self.c = APIClient()
        self.c.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

        self.cat_ing = Categoria.objects.create(usuario=self.u, nombre='Salario', tipo='ingreso')
        self.cat_gas = Categoria.objects.create(usuario=self.u, nombre='Alquiler', tipo='gasto')

        self.m1 = Movimiento.objects.create(usuario=self.u, categoria=self.cat_ing,
                                            descripcion='Ingreso', fecha=date(2025,5,17), cantidad='2000.00')
        self.m2 = Movimiento.objects.create(usuario=self.u, categoria=self.cat_gas,
                                            descripcion='Gasto', fecha=date(2025,5,18), cantidad='500.00')

    def test_auth_required(self):
        c2 = APIClient()
        r = c2.get('/api/movimientos/')
        self.assertEqual(r.status_code, 401)

    def test_list_all(self):
        r = self.c.get('/api/movimientos/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 2)

    def test_filter_by_categoria(self):
        r = self.c.get('/api/movimientos/', {'categoria': self.cat_ing.id})
        data = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertTrue(all(m['categoria'] == self.cat_ing.id for m in data))

    def test_filter_by_tipo(self):
        r = self.c.get('/api/movimientos/', {'tipo': 'gasto'})
        data = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertTrue(all(m['categoria'] == self.cat_gas.id for m in data))

    def test_filter_by_dates(self):
        r1 = self.c.get('/api/movimientos/', {'date_from': '2025-05-18'})
        self.assertEqual(len(r1.json()), 1)  # solo m2
        r2 = self.c.get('/api/movimientos/', {'date_to': '2025-05-17'})
        self.assertEqual(len(r2.json()), 1)  # solo m1
        r3 = self.c.get('/api/movimientos/', {'date_from': '2025-05-17', 'date_to': '2025-05-18'})
        self.assertEqual(len(r3.json()), 2)

    def test_resumen_endpoint(self):
        r = self.c.get('/api/movimientos/resumen/', {'date_from': '2025-05-01', 'date_to': '2025-05-31'})
        self.assertEqual(r.status_code, 200)
        j = r.json()
        self.assertEqual(float(j['total_ingresos']), 2000.0)
        self.assertEqual(float(j['total_gastos']), 500.0)
        self.assertEqual(float(j['balance']), 1500.0)
