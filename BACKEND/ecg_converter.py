import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
import torch
import torchvision
from torch import nn, optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt

DATASET_PATH = r"C:\Users\Avdhoot\Downloads\gwbz3fsgp8-2"

image_size = 224

images = []
labels = []

# ========================
# FOLDER LABEL MAP
# ========================

label_map = {
"Normal Person ECG Images (284x12=3408)":0,
"ECG Images of Myocardial Infarction Patients (240x12=2880)":1,
"ECG Images of Patient that have History of MI (172x12=2064)":1,
"ECG Images of Patient that have abnormal heartbeat (233x12=2796)":2
}

# ========================
# LOAD IMAGES
# ========================

for folder in label_map:

    folder_path = os.path.join(DATASET_PATH, folder)

    label = label_map[folder]

    for img_name in os.listdir(folder_path):

        img_path = os.path.join(folder_path, img_name)

        try:

            img = cv2.imread(img_path)

            img = cv2.resize(img,(224,224))

            images.append(img)
            labels.append(label)

        except:
            pass


images = np.array(images)
labels = np.array(labels)

print("Total Images:",len(images))

# ========================
# TRAIN TEST SPLIT
# ========================

X_train,X_test,y_train,y_test = train_test_split(
images,
labels,
test_size=0.2,
random_state=42
)

# ========================
# CONVERT TO TENSOR
# ========================

X_train = torch.tensor(X_train).permute(0,3,1,2).float()/255
X_test = torch.tensor(X_test).permute(0,3,1,2).float()/255

y_train = torch.tensor(y_train)
y_test = torch.tensor(y_test)

train_dataset = TensorDataset(X_train,y_train)
test_dataset = TensorDataset(X_test,y_test)

train_loader = DataLoader(train_dataset,batch_size=32,shuffle=True)
test_loader = DataLoader(test_dataset,batch_size=32)

# ========================
# MODEL
# ========================

model = torchvision.models.resnet18(pretrained=True)

model.fc = nn.Linear(model.fc.in_features,3)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = model.to(device)

criterion = nn.CrossEntropyLoss()

optimizer = optim.Adam(model.parameters(),lr=0.0001)

# ========================
# TRAINING
# ========================

for epoch in range(10):

    model.train()

    total_loss = 0

    for images,labels in train_loader:

        images = images.to(device)
        labels = labels.to(device)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(outputs,labels)

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print("Epoch:",epoch+1,"Loss:",total_loss)

# ========================
# TEST + METRICS
# ========================

model.eval()

correct = 0
total = 0

all_preds = []
all_labels = []

with torch.no_grad():

    for images,labels in test_loader:

        images = images.to(device)
        labels = labels.to(device)

        outputs = model(images)

        _,predicted = torch.max(outputs,1)

        total += labels.size(0)

        correct += (predicted==labels).sum().item()

        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())

print("Accuracy:",100*correct/total)

# ========================
# CONFUSION MATRIX
# ========================

cm = confusion_matrix(all_labels, all_preds)

print("\nConfusion Matrix:")
print(cm)

plt.figure(figsize=(6,5))

sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")

plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.title("Confusion Matrix")

plt.show()


# ========================
# PRECISION / RECALL / F1
# ========================

print("\nClassification Report:")
print(classification_report(all_labels, all_preds))