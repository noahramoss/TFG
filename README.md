<div align="center">
  <h1 align="center">Aplicación Web para la Gestión de Finanzas Personales 💰</h1>

  <p align="center">
    Un sistema Full Stack diseñado para registrar, analizar y gestionar la economía personal de manera eficiente.
    <br />
    <strong>Proyecto de Trabajo de Fin de Grado (TFG) - Ingeniería Informática</strong>
  </p>
</div>

<details>
  <summary>Tabla de Contenidos</summary>
  <ol>
    <li><a href="#acerca-del-proyecto">Acerca del Proyecto</a></li>
    <li><a href="#características-principales">Características Principales</a></li>
    <li><a href="#tecnologías-utilizadas">Tecnologías Utilizadas</a></li>
    <li><a href="#arquitectura-del-sistema">Arquitectura del Sistema</a></li>
    <li>
      <a href="#empezando">Empezando</a>
      <ul>
        <li><a href="#prerrequisitos">Prerrequisitos</a></li>
        <li><a href="#instalación">Instalación</a></li>
      </ul>
    </li>
    <li><a href="#uso-de-la-aplicación">Uso de la Aplicación</a></li>
    <li><a href="#documentación-de-la-api">Documentación de la API</a></li>
    <li><a href="#autor">Autor</a></li>
  </ol>
</details>

## Acerca del Proyecto

La gestión de las finanzas personales suele ser un proceso complejo si no se cuenta con las herramientas adecuadas. El uso de hojas de cálculo u otras aplicaciones genéricas suele volverse inmanejable con el tiempo. Este proyecto propone una solución web enfocada en simplificar el registro de ingresos y gastos, brindando resúmenes analíticos mediante estadísticas e indicadores clave (KPIs) claros y concisos.

Esta aplicación ha sido desarrollada como Trabajo Fin de Grado en Ingeniería Informática en la Universidad de Granada, ofreciendo una experiencia amigable (UI/UX) y una robusta arquitectura cliente-servidor.

## Características Principales

- 🔐 **Autenticación Segura:** Sistema de registro e inicio de sesión protegido mediante tokens (Token Authentication). Aislamiento total de datos por usuario.
- 📂 **Gestión de Categorías Personalizadas:** Crea categorías dinámicas (Ingreso/Gasto) que se adaptan a tus necesidades, evitando duplicados y protegiendo el borrado en cascada.
- 💸 **Control de Movimientos:** Añade, edita, elimina, busca, filtra y ordena tus transacciones de manera ágil. Validaciones automáticas para evitar cantidades inválidas.
- 📊 **Panel de Estadísticas (Dashboard):** Visualización interactiva con gráficos de barras (Ingresos vs Gastos mensuales) y gráficos circulares (Desglose de gastos/ingresos por categorías).
- 📱 **Diseño Responsive y Accesible:** Interfaz adaptable a diferentes tamaños de pantalla, implementada siguiendo lineamientos de usabilidad y rendimiento.

## Tecnologías Utilizadas

Este proyecto sigue una arquitectura **SPA (Single Page Application)** conectada a una **API REST**.

### Frontend
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) **React 19**
- ![Material UI](https://img.shields.io/badge/MUI-%230081CB.svg?style=for-the-badge&logo=mui&logoColor=white) **Material UI (MUI)**
- **React Router** (Gestión de rutas mediante HashRouter)
- **Recharts** (Generación de gráficos de estadísticas)
- **Axios** (Cliente HTTP para la comunicación con la API)

### Backend
- ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) **Python 3.11+**
- ![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white) **Django 4.2+**
- **Django REST Framework (DRF)** (Construcción y exposición de la API REST)

### Base de Datos
- ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) **PostgreSQL 14+** *(El proyecto cuenta con soporte nativo para SQLite en entornos locales)*

## Arquitectura del Sistema

El sistema utiliza una **Arquitectura Cliente-Servidor** separada lógicamente en capas:
1. **Capa de Presentación:** Desarrollada con React. Encargada de renderizar la interfaz, manejar el estado global/local de componentes y realizar validaciones tempranas de cara al usuario.
2. **Capa de Servicios de Aplicación:** API RESTful construida con Django REST Framework. Provee los *endpoints* para la lógica de negocio, realiza la validación de seguridad a través de *serializers* y verifica la autenticación aislando la información por cada usuario.
3. **Capa de Dominio y Acceso a Datos:** ORM de Django encargado de la interacción con la base de datos PostgreSQL, implementando reglas de integridad a nivel de esquema (e.g. constraints de unicidad y chequeos de valores positivos en los importes).

## Empezando

Para obtener una copia local en funcionamiento, sigue estos pasos:

### Prerrequisitos

- Python 3.11 o superior.
- Node.js 18+ y npm 9+.
- PostgreSQL (Opcional para pruebas locales, ya que está configurado SQLite por defecto).

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/noahramoss/TFG.git
   cd TFG
   ```

2. **Configuración del Backend**
   ```bash
   # Crear y activar el entorno virtual
   python3 -m venv venv
   source venv/bin/activate  # En Windows usar: .\venv\Scripts\activate

   # Instalar dependencias del backend
   pip install --upgrade pip
   pip install -r requirements.txt

   # Aplicar migraciones a la base de datos (se creará db.sqlite3)
   python manage.py migrate

   # Crear un superusuario para acceder al panel de administración de Django
   python manage.py createsuperuser

   # Iniciar el servidor local
   python manage.py runserver
   ```
   El backend se ejecutará en `http://127.0.0.1:8000/`.

3. **Configuración del Frontend**
   ```bash
   # Abre una nueva pestaña/terminal y accede a la carpeta del frontend
   cd frontend

   # Instalar dependencias
   npm install

   # Iniciar la aplicación en modo desarrollo
   npm start
   ```
   El frontend abrirá automáticamente en tu navegador apuntando a `http://localhost:3000/`.

## Uso de la Aplicación

1. **Registro e Inicio de Sesión:** Ingresa a la plataforma creando una cuenta con usuario y contraseña seguros. Tu sesión se gestionará mediante tokens que te identificarán en cada petición de manera automática.
2. **Administrar Categorías:** Da de alta tus propias categorías para ingresos (ej. Salario, Rendimientos) y gastos (ej. Alimentación, Vivienda, Transporte).
3. **Control de Movimientos:** Accede a un potente listado donde puedes crear, visualizar, editar y borrar movimientos. Utiliza los filtros avanzados y la barra de búsqueda para ubicar gastos concretos u observar los KPIs interactivos en tiempo real.
4. **Dashboard y Estadísticas:** Alterna entre periodos (Mes actual, año en curso, mes anterior...) para analizar tus finanzas con gráficos de barras comparativos y porcentajes categorizados en diagramas circulares.

## Documentación de la API

La aplicación expone una sólida API REST, consumible bajo el prefijo `/api/`. Entre los principales Endpoints se destacan:

- `POST /api/registro/` - Alta de usuario nuevo y retorno del Token de sesión.
- `POST /api-token-auth/` - Login; obtiene el Token a partir del usuario y contraseña.
- `GET /api/categorias/` - Obtiene la lista de categorías del usuario autenticado (Permite filtrar por `tipo`).
- `GET /api/movimientos/` - Lista paginada de movimientos (Permite ordenación, búsqueda por descripción y filtros por fecha/tipo/categoría).
- `GET /api/movimientos/resumen/` - Devuelve un resumen consolidado con ingresos, gastos y balance.
- `GET /api/movimientos/resumen-mensual/` - Devuelve una serie temporal mensual (ingresos vs gastos) lista para el consumo de gráficos.

*Todos los endpoints (excepto registro y login) requieren enviar un encabezado de autorización: `Authorization: Token <tu_token>`*.

## Autor

**Noah Ramos González**  
- **Institución:** Escuela Técnica Superior de Ingenierías Informática y de Telecomunicación — Universidad de Granada
- **Fecha:** Noviembre de 2025
- **Proyecto:** Trabajo de Fin de Grado (TFG) - Ingeniería Informática
