def f(x):
    return x**3 - 3*x**2 - 1

def fprime(x):
    return 3*x**2 - 6*x

x0 = 2
tol = 1e-6

while True:
  # Appliquer la fonction d'itération
  x1 = x0 - f(x0)/fprime(x0);
  
  # Vérifier si la distance entre les approximations est inférieure à la tolérance
  if abs(x1 - x0) < tol:
      break;

  x0 = x1;

print("Le zéro de la fonction est approximativement", x0)
