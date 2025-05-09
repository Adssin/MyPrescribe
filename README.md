# Skin Disease Classification System

## Project Overview
This project implements an advanced skin disease classification system using deep learning, specifically designed to assist in the early detection and classification of various skin conditions. The system combines state-of-the-art image processing with an intuitive web interface for medical professionals and researchers.

## Technical Architecture

### 1. Deep Learning Model
- **Base Architecture**: ResNet18 (Residual Neural Network)
- **Pre-training**: ImageNet weights
- **Fine-tuning**: Adapted for skin disease classification
- **Input Processing**: 224x224 RGB images
- **Output**: Multi-class classification with confidence scores

### 2. Data Processing Pipeline
- **Image Preprocessing**:
  - Resizing to 224x224 pixels
  - Normalization using ImageNet statistics
  - Data augmentation techniques:
    - Random horizontal flips
    - Random rotations
    - Color jittering
    - Random cropping

### 3. Web Application
- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Features**:
  - Drag-and-drop image upload
  - Real-time image preview
  - Patient symptom collection
  - Interactive result display
  - Confidence visualization
  - Responsive design

## Technology Stack

### Backend Technologies
- Python 3.8+
- PyTorch for deep learning
- Flask for web server
- Pillow for image processing
- NumPy for numerical operations

### Frontend Technologies
- HTML5 for structure
- CSS3 with animations
- JavaScript for interactivity
- Bootstrap 5 for responsive design
- Font Awesome for icons

## Key Features

### 1. Image Classification
- Real-time disease classification
- Confidence score calculation
- Multiple disease probability ranking
- High-resolution image support

### 2. User Interface
- Modern, intuitive design
- Animated transitions
- Progress indicators
- Error handling with user feedback
- Mobile-responsive layout

### 3. Patient Information Collection
- Age input
- Duration of condition
- Symptom checklist:
  - Itching
  - Burning sensation
  - Pain
  - Redness
- Additional notes section

### 4. Results Presentation
- Clear disease classification
- Confidence percentage
- Visual confidence bar
- Detailed probability breakdown
- Patient information summary

## Project Structure
```
Final Case Set/
├── models/
│   └── final_model.pt       # Trained model weights
├── Website/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Dependencies
│   ├── static/
│   │   ├── script.js      # Frontend logic
│   │   ├── styles.css     # Styling
│   │   └── uploads/       # Image upload directory
│   └── templates/
│       └── index.html     # Main webpage
```

## Installation and Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r Website/requirements.txt
   ```
4. Run the application:
   ```bash
   cd Website
   python app.py
   ```

## Model Architecture Details

### ResNet18 Modifications
- Input layer: 3 channels (RGB), 224x224
- Modified final fully connected layer for disease classes
- Softmax activation for probability distribution
- Dropout layers for regularization

### Training Process
1. Transfer learning from ImageNet weights
2. Fine-tuning on skin disease dataset
3. Data augmentation during training
4. Early stopping to prevent overfitting
5. Learning rate scheduling

## Performance Optimization

### Image Processing
- Efficient image resizing
- Batch processing capability
- Memory-efficient data handling
- Caching for repeated operations

### Web Application
- Asynchronous image upload
- Progressive image loading
- Optimized CSS animations
- Efficient DOM manipulation

## Security Features
- Secure file upload handling
- Input sanitization
- File type validation
- Size limit enforcement
- Error handling

## Future Enhancements
1. Multi-language support
2. Offline functionality
3. Mobile application
4. Enhanced analytics
5. Integration with medical records
6. Batch processing capability

## Contributors
- Model Development Team
- Frontend Development Team
- UX/UI Design Team
- Medical Advisors

## License
This project is licensed under the MIT License - see the LICENSE file for details. 