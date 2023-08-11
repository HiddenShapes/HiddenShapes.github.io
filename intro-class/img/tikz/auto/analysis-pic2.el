(TeX-add-style-hook
 "analysis-pic2"
 (lambda ()
   (TeX-add-symbols
    "mystart"
    "myend")
   (LaTeX-add-environments
    '("exercise" LaTeX-env-args ["argument"] 0)))
 :plain-tex)

