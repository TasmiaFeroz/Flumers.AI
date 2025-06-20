# Import the AppConfig class from Django
from django.apps import AppConfig

# The AppConfig class is used to configure application-specific settings.
# It allows developers to define metadata and behavior for the app.

# Define the configuration for the img_classification app
class ImgClassificationConfig(AppConfig):
    # Specify the default auto field type for models
    default_auto_field = 'django.db.models.BigAutoField'
    # Set the name of the app
    name = 'img_classification'
