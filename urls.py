# img_classification/urls.py

# Import necessary modules and the classify_image view
from django.urls import path
from .views import classify_image

# The urlpatterns list defines the routes for the img_classification application.
# Each route maps a URL pattern to a specific view function.

# Define URL patterns for the img_classification application
urlpatterns = [
    # Route for the image classification API
    path('classify/', classify_image, name='image_classification'),
    # The 'classify/' route handles requests for image classification.
    # It invokes the classify_image view function to process the request.
]
