def main():
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader
    from torchvision import models, transforms, datasets
    from tqdm import tqdm
    from pathlib import Path
    import os

    # Paths
    BASE = Path(__file__).parent.parent
    TRAIN_DIR = BASE / 'dataset' / 'train'
    VAL_DIR = BASE / 'dataset' / 'val'
    MODEL_DIR = BASE / 'models'
    MODEL_DIR.mkdir(exist_ok=True)

    # Hyperparameters
    BATCH_SIZE = 32
    EPOCHS = 15
    LR = 1e-4
    IMG_SIZE = 224
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # Datasets and loaders
    train_dataset = datasets.ImageFolder(str(TRAIN_DIR), transform=train_transform)
    val_dataset = datasets.ImageFolder(str(VAL_DIR), transform=val_transform)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    # Model
    num_classes = len(train_dataset.classes)
    model = models.resnet18(pretrained=True)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(DEVICE)

    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=2)

    # Training loop with progress bars
    best_val_acc = 0.0
    for epoch in range(EPOCHS):
        print(f'Epoch {epoch+1}/{EPOCHS}')
        model.train()
        running_loss = 0.0
        running_corrects = 0
        total = 0
        train_pbar = tqdm(train_loader, desc='Training', leave=False)
        for inputs, labels in train_pbar:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            total += inputs.size(0)
            train_pbar.set_postfix({'loss': loss.item(), 'acc': (running_corrects.double()/total).item()})
        epoch_loss = running_loss / total
        epoch_acc = running_corrects.double() / total
        print(f'Train Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

        # Validation
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        val_total = 0
        val_pbar = tqdm(val_loader, desc='Validation', leave=False)
        with torch.no_grad():
            for inputs, labels in val_pbar:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)
                val_total += inputs.size(0)
                val_pbar.set_postfix({'loss': loss.item(), 'acc': (val_corrects.double()/val_total).item()})
        val_epoch_loss = val_loss / val_total
        val_epoch_acc = val_corrects.double() / val_total
        print(f'Val Loss: {val_epoch_loss:.4f} Acc: {val_epoch_acc:.4f}')
        scheduler.step(val_epoch_loss)

        # Save best model
        if val_epoch_acc > best_val_acc:
            best_val_acc = val_epoch_acc
            torch.save({
                'model_state_dict': model.state_dict(),
                'class_names': list(train_dataset.classes)
            }, MODEL_DIR / 'best_model.pt')
            print(f'Best model saved with val acc: {best_val_acc:.4f}')

    print('Training complete!')

if __name__ == "__main__":
    main() 