(TeX-add-style-hook
 "rootedPath"
 (lambda ()
   (TeX-run-style-hooks
    "latex2e"
    "standalone"
    "standalone10"
    "tikz")
   (LaTeX-add-environments
    '("exercise" LaTeX-env-args ["argument"] 1)
    '("ex" LaTeX-env-args ["argument"] 0)))
 :latex)

