# Définir la fonction dont on veut trouver le zéro
def f(x):
    return x**2 - 3

# Définir la dérivée de cette fonction
def fprime(x):
    return 2*x

# Définir l'estimation initiale pour le zéro
x0 = 1.5

# Définir la tolérance pour la convergence
tol = 1e-6

#Itérer la méthode de Newton jusqu'à ce que notre condition soit remplie
while True:
    
  # Appliquer la fonction d'itération
  x1 = x0 - f(x0)/fprime(x0);
  
  # Vérifier si la distance entre les approximations est inférieure à la tolérance
  if abs(x1 - x0) < tol:
      break;

  x0 = x1;

print("Le zéro de la fonction est approximativement", x0)
