(TeX-add-style-hook
 "not_table"
 (lambda ()
   (TeX-add-to-alist 'LaTeX-provided-class-options
                     '(("standalone" "border=10pt")))
   (TeX-run-style-hooks
    "latex2e"
    "standalone"
    "standalone10"
    "array"
    "fontspec"
    "xcolor")
   (TeX-add-symbols
    '("firatt" 1)
    "firatrue"
    "firafalse"))
 :latex)

