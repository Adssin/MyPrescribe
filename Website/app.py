from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from pathlib import Path
import torch
from torchvision import models, transforms
from PIL import Image
import logging
import json
import google.generativeai as palm
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app with correct template and static folders
app = Flask(__name__, 
           template_folder='templates',
           static_url_path='',
           static_folder='static')

app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize model
model = None
class_names = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Configure Google PaLM API
GOOGLE_API_KEY = 'AIzaSyBcv9KxTBLB_nhtvD4JplFRk5-zhd2ACkU'
palm.configure(api_key=GOOGLE_API_KEY)

# System message to set the context for the AI
SYSTEM_PROMPT = """You are a knowledgeable healthcare assistant specializing in dermatology and skin conditions. 
Your role is to:
1. Provide accurate information about skin conditions and treatments
2. Help users understand when they should consult a dermatologist
3. Offer general skincare advice
4. Guide users in using the skin disease classification system
5. Maintain a professional and empathetic tone
6. Always remind users that your advice is not a substitute for professional medical diagnosis

Remember to:
- Be clear and concise
- Use simple language
- Show empathy
- Encourage professional medical consultation when appropriate
- Never make definitive diagnoses
"""

# Fallback responses when AI is unavailable
FALLBACK_RESPONSES = {
    'default': "I'm here to help with skin health questions. For the most accurate advice, please consult with a healthcare professional.",
    'symptoms': "Could you describe your symptoms in detail? This will help me provide better information, though remember to consult a doctor for proper diagnosis.",
    'condition': "While I can provide general information about skin conditions, it's best to consult with a dermatologist for accurate diagnosis and treatment.",
    'dermatologist': "I can help you locate a dermatologist near you using our map feature. Would you like to try that?",
    'treatment': "Treatment options should be discussed with a qualified healthcare provider. Would you like help finding a dermatologist?",
    'hello': "Hello! How can I assist you with your skin health concerns today?",
    'thanks': "You're welcome! Is there anything else you'd like to know about skin health?",
    'bye': "Take care! Don't hesitate to return if you have more questions about skin health."
}

def load_model():
    global model, class_names
    try:
        # Load the model
        model_path = Path(__file__).parent.parent / 'models' / 'best_model.pt'
        checkpoint = torch.load(model_path, map_location=device)
        
        # Initialize model
        model = models.resnet18(pretrained=False)
        # If checkpoint is a state_dict only (from train_with_progress.py), use default class_names
        if isinstance(checkpoint, dict) and 'class_names' in checkpoint:
            num_classes = len(checkpoint['class_names'])
            class_names = checkpoint['class_names']
            model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
            model.load_state_dict(checkpoint['model_state_dict'])
        else:
            # Fallback: try to infer num_classes from state_dict
            # (for compatibility with plain state_dict saves)
            num_classes = 23  # fallback, update if needed
            class_names = [str(i) for i in range(num_classes)]
            model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
            model.load_state_dict(checkpoint)
        model = model.to(device)
        model.eval()
        logger.info(f"Model loaded successfully. Classes: {class_names}")
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

def preprocess_image(image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    image = Image.open(image_path).convert('RGB')
    image = transform(image)
    image = image.unsqueeze(0)  # Add batch dimension
    return image.to(device)

def predict_image(image_path):
    try:
        # Preprocess image
        image = preprocess_image(image_path)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
        
        # Get results
        predicted_class = class_names[predicted.item()]
        confidence_score = confidence.item()
        
        # Get probabilities for all classes
        class_probabilities = {
            class_name: prob.item() 
            for class_name, prob in zip(class_names, probabilities[0])
        }
        
        return {
            'predicted_class': predicted_class,
            'confidence': confidence_score,
            'class_probabilities': class_probabilities
        }
        
    except Exception as e:
        logger.error(f"Error making prediction: {str(e)}")
        raise

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file:
            # Save the uploaded file
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Get additional symptoms data
            age = request.form.get('age', '')
            duration = request.form.get('duration', '')
            symptoms = request.form.get('symptoms', '{}')
            notes = request.form.get('notes', '')
            
            try:
                symptoms = json.loads(symptoms)
            except:
                symptoms = {}
            
            # Make prediction
            result = predict_image(filepath)
            
            # Add image path and symptoms to result
            result['image_path'] = f'/static/uploads/{filename}'
            result['patient_data'] = {
                'age': age,
                'duration': duration,
                'symptoms': symptoms,
                'notes': notes
            }
            
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '').lower()
        conversation_history = data.get('history', [])

        try:
            # Format conversation history for PaLM
            formatted_history = ""
            for msg in conversation_history[-5:]:  # Keep last 5 messages for context
                role = "User" if msg["role"] == "user" else "Assistant"
                formatted_history += f"{role}: {msg['content']}\n"

            # Prepare the prompt
            prompt = f"{SYSTEM_PROMPT}\n\nConversation history:\n{formatted_history}\nUser: {user_message}\nAssistant:"

            # Get response from PaLM
            response = palm.generate_text(
                model='models/chat-bison-001',
                prompt=prompt,
                temperature=0.7,
                max_output_tokens=150,
            )

            if response.result:
                ai_response = response.result.strip()
            else:
                ai_response = get_fallback_response(user_message)

        except Exception as e:
            logger.error(f"PaLM API error: {str(e)}")
            ai_response = get_fallback_response(user_message)

        return jsonify({
            'response': ai_response,
            'quick_replies': get_quick_replies(user_message)
        })

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({
            'response': get_fallback_response('default'),
            'quick_replies': get_quick_replies('default')
        }), 200  # Return 200 to handle error gracefully on frontend

def get_fallback_response(message):
    # Check for keywords in the message and return appropriate fallback response
    if 'symptom' in message:
        return FALLBACK_RESPONSES['symptoms']
    elif 'condition' in message:
        return FALLBACK_RESPONSES['condition']
    elif 'dermatologist' in message:
        return FALLBACK_RESPONSES['dermatologist']
    elif 'treatment' in message:
        return FALLBACK_RESPONSES['treatment']
    elif any(word in message for word in ['hello', 'hi', 'hey']):
        return FALLBACK_RESPONSES['hello']
    elif 'thank' in message:
        return FALLBACK_RESPONSES['thanks']
    elif 'bye' in message:
        return FALLBACK_RESPONSES['bye']
    return FALLBACK_RESPONSES['default']

def get_quick_replies(message):
    # Default quick replies
    quick_replies = [
        "Tell me about skin conditions",
        "Find a dermatologist",
        "Check my symptoms",
        "Skincare advice"
    ]
    
    # Add specific quick replies based on context
    if 'symptom' in message:
        quick_replies = [
            "Describe my symptoms",
            "When to see a doctor",
            "Find a dermatologist",
            "Common skin conditions"
        ]
    elif 'condition' in message:
        quick_replies = [
            "Treatment options",
            "Prevention tips",
            "Find a specialist",
            "Similar conditions"
        ]
    
    return quick_replies

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Load the model
    load_model()
    
    # Run the app
    logger.info("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000) 