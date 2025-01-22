import sys
import fitz  # PyMuPDF
from PIL import Image

# get argv
pdf_path = sys.argv[1]
destination = sys.argv[2]

# Open the PDF
doc = fitz.open(pdf_path)

# Define a high zoom factor for very high-quality output
zoom = 2  # Increase to 5x resolution; adjust to control quality (higher = larger image)
matrix = fitz.Matrix(zoom, zoom)  # Scaling matrix for higher quality

# Store images of each page
page_images = []

# Render each page as an image and append to list
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(matrix=matrix)  # Apply high scaling matrix
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    page_images.append(img)

# Calculate the total height of the final image
total_height = sum(img.height for img in page_images)
max_width = max(img.width for img in page_images)

# Create a blank canvas to paste all page images
final_image = Image.new("RGB", (max_width, total_height))

# Paste each page image into the final image
y_offset = 0
for img in page_images:
    final_image.paste(img, (0, y_offset))
    y_offset += img.height

# Save the final combined image with maximum quality settings
final_image.save(destination, quality=100, optimize=True)
