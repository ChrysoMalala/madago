from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('utilisateurs.urls')),
    path('api/', include('conducteurs.urls')),
    path('api/', include('vehicules.urls')),
    path('api/', include('trajets.urls')),
    path('api/', include('reservations.urls')),
    path('api/', include('avis.urls')),
    path('api/', include('notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)