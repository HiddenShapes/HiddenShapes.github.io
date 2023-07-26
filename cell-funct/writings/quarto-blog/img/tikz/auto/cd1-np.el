(TeX-add-style-hook
 "cd1-np"
 (lambda ()
   (TeX-run-style-hooks
    "latex2e"
    "standalone"
    "standalone10"
    "tikz-cd")
   (LaTeX-add-environments
    '("exercise" LaTeX-env-args ["argument"] 1)
    '("ex" LaTeX-env-args ["argument"] 0)))
 :latex)

