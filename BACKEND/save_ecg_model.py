"""
Run this script ONCE after training to save your ECG model.
Place it in your BACKEND/ folder and run:  python save_ecg_model.py
"""

import torch
import torchvision
from torch import nn
import os

# ── Rebuild the same architecture used during training ──
model = torchvision.models.resnet18()
model.fc = nn.Linear(model.fc.in_features, 3)

# ── If you already have a fully saved model (not just state_dict) ──
# e.g. torch.save(model, "...") was used during training:
#
# full_model = torch.load("path/to/your/trained_model.pth", map_location="cpu")
# torch.save(full_model.state_dict(), "ecg_cad_model.pth")
# print("✅ Saved state_dict to ecg_cad_model.pth")

# ── If you saved state_dict directly during training ──
# Just rename / copy that file to ecg_cad_model.pth in the BACKEND/ folder.

# ── To verify the saved model loads correctly ──
def verify(path="ecg_cad_model.pth"):
    if not os.path.exists(path):
        print(f"❌ File not found: {path}")
        return

    m = torchvision.models.resnet18()
    m.fc = nn.Linear(m.fc.in_features, 3)
    m.load_state_dict(torch.load(path, map_location="cpu"))
    m.eval()
    print(f"✅ Model loaded successfully from {path}")

    # Quick forward pass test
    dummy = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        out = m(dummy)
    print(f"   Output shape: {out.shape}  (expected: [1, 3])")

verify()
