(TeX-add-style-hook
 "triangleArea3"
 (lambda ()
   (TeX-run-style-hooks
    "latex2e"
    "standalone"
    "standalone10"
    "tikz")
   (LaTeX-add-environments
    '("exercise" LaTeX-env-args ["argument"] 0)))
 :latex)

