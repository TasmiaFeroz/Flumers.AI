# img_classification/model.py
# Import necessary libraries for model inference
import onnxruntime as rt
from PIL import Image
import numpy as np

# The EfficientNetB1Model class is designed for image classification using the EfficientNet-B1 architecture.
# It utilizes ONNX Runtime for efficient inference.

# Define a class for EfficientNet-B1 model inference
class EfficientNetB1Model:
    def __init__(self, model_path):
        # Initialize the ONNX Runtime session
        self.session = rt.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def preprocess(self, image: Image.Image):
        # Convert the image to RGB format
        image = image.convert('RGB')
        # Resize the image to the expected input size for the model
        image = image.resize((240, 240))
        # Normalize the image pixel values to the range [0, 1]
        img_np = np.array(image).astype(np.float32) / 255.0
        # Perform mean-variance normalization using ImageNet stats
        img_np = (img_np - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        # Rearrange the dimensions of the image to match the model's input format
        img_np = np.transpose(img_np, (2, 0, 1))
        # Add a batch dimension to the image tensor
        img_np = np.expand_dims(img_np, axis=0).astype(np.float32)
        return img_np

    def predict(self, image: Image.Image):
        # Preprocess the input image
        input_tensor = self.preprocess(image)
        # Perform model inference
        outputs = self.session.run(None, {self.input_name: input_tensor})
        # Extract the prediction from the model output
        prediction = int(np.argmax(outputs[0]))
        confidence = float(np.max(outputs[0]))
        return prediction, confidence

