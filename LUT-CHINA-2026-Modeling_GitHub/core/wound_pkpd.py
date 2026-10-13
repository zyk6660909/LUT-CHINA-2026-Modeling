import numpy as np
from scipy.integrate import odeint

class WoundContractionModel:
    """
    Coupled Two-Target Synergistic Hill Pharmacodynamics
    and Wound Area Contraction ODE Solver:
    dW/dt = -k_close * W * (1 + alpha * E1 + beta * E2)
    """
    def __init__(self, k_close=0.08, alpha=1.5, beta=1.2, EC50_1=15.0, EC50_2=25.0):
        self.k_close = k_close
        self.alpha = alpha
        self.beta = beta
        self.EC50_1 = EC50_1
        self.EC50_2 = EC50_2

    def hill_effect(self, C, EC50, n=2.0):
        return (C**n) / (EC50**n + C**n)

    def simulate_closure(self, days=21, C1_mg_L=20.0, C2_mg_L=30.0, treatment_type="dual_gradient"):
        t = np.linspace(0, days, 200)
        
        if treatment_type == "untreated":
            eff = 0.0
        elif treatment_type == "commercial":
            eff = 0.5 * (self.hill_effect(C1_mg_L * 0.4, self.EC50_1) + self.hill_effect(C2_mg_L * 0.4, self.EC50_2))
        else:  # dual_gradient
            E1 = self.hill_effect(C1_mg_L, self.EC50_1)
            E2 = self.hill_effect(C2_mg_L, self.EC50_2)
            eff = self.alpha * E1 + self.beta * E2

        def dW_dt(W, time):
            return -self.k_close * W * (1.0 + eff)

        W = odeint(dW_dt, 100.0, t)  # Initial wound area = 100%
        return t, W.flatten()
