# movimientos/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10                     # tamaño por defecto
    page_size_query_param = 'page_size'  # permite ?page_size=5,20,...
    max_page_size = 100
