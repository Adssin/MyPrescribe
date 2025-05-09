import os
import shutil
import random
from pathlib import Path
from tqdm import tqdm

# Paths
BASE = Path(__file__).parent
SRC = BASE / 'dataset' / 'dataset' / 'datasetlow'
TRAIN = BASE / 'dataset' / 'train'
VAL = BASE / 'dataset' / 'val'

# Create destination folders
TRAIN.mkdir(parents=True, exist_ok=True)
VAL.mkdir(parents=True, exist_ok=True)

# List all class folders
class_folders = [f for f in SRC.iterdir() if f.is_dir()]

# Count total images for progress bar
total_images = sum(len(list((SRC / c.name).glob('*.*'))) for c in class_folders)

with tqdm(total=total_images, desc='Splitting dataset') as pbar:
    for class_folder in class_folders:
        class_name = class_folder.name.replace(' ', '_').replace('-', '_')
        train_class_dir = TRAIN / class_name
        val_class_dir = VAL / class_name
        train_class_dir.mkdir(parents=True, exist_ok=True)
        val_class_dir.mkdir(parents=True, exist_ok=True)

        images = [f for f in class_folder.glob('*.*') if f.suffix.lower() in ['.jpg', '.jpeg', '.png']]
        random.shuffle(images)
        split_idx = int(len(images) * 0.8)
        train_imgs = images[:split_idx]
        val_imgs = images[split_idx:]

        for img in train_imgs:
            shutil.copy2(img, train_class_dir / img.name)
            pbar.update(1)
        for img in val_imgs:
            shutil.copy2(img, val_class_dir / img.name)
            pbar.update(1)

print('Dataset split complete!') 