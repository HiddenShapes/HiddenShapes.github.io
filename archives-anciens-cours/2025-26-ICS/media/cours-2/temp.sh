#!/bin/bash

# Compile LaTeX files to PDF using XeLaTeX
echo "Compiling LaTeX files..."
xelatex and_table.tex
xelatex or_table.tex
xelatex not_table.tex

# Convert PDFs to SVG using pdf2svg
echo "Converting PDFs to SVG..."
pdf2svg and_table.pdf and_table.svg
pdf2svg or_table.pdf or_table.svg
pdf2svg not_table.pdf not_table.svg

echo "Done! Generated files:"
echo "- and_table.svg"
echo "- or_table.svg"
echo "- not_table.svg"

# Optional: Clean up auxiliary files
echo "Cleaning up auxiliary files..."
rm -f *.aux *.log *.fdb_latexmk *.fls *.synctex.gz

echo "Conversion complete!"
