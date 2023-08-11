(TeX-add-style-hook
 "analysis-pic3"
 (lambda ()
   (TeX-add-to-alist 'LaTeX-provided-class-options
                     '(("standalone" "tikz" "border=0pt")))
   (TeX-run-style-hooks
    "latex2e"
    "standalone"
    "standalone10"
    "pgfplots")
   (TeX-add-symbols
    "mystart"
    "myend")
   (LaTeX-add-environments
    '("exercise" LaTeX-env-args ["argument"] 0)))
 :latex)

