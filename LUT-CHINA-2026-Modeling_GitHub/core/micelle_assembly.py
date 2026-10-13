import numpy as np
from scipy.optimize import minimize

class HollandRubinghModel:
    """
    Ternary Non-ideal Mixed Micelle State Equation Solver
    Based on Regular Solution Theory (Holland & Rubingh, 1983).
    """
    def __init__(self, single_cmc, temperature_k=298.15):
        self.cmc = single_cmc  # dict: {'A': cmc_a, 'B': cmc_b, 'C': cmc_c}
        self.T = temperature_k
        self.R = 8.314e-3  # kJ/(mol*K)

    def activity_coefficients(self, x, chi):
        """Calculate activity coefficients f_i given micelle mole fractions x and chi parameters."""
        xA, xB, xC = x
        chi_AB, chi_AC, chi_BC = chi
        
        ln_fA = chi_AB * xB**2 + chi_AC * xC**2 + xB * xC * (chi_AB + chi_AC - chi_BC)
        ln_fB = chi_AB * xA**2 + chi_BC * xC**2 + xA * xC * (chi_AB + chi_BC - chi_AC)
        ln_fC = chi_AC * xA**2 + chi_BC * xB**2 + xA * xB * (chi_AC + chi_BC - chi_AB)
        return np.exp([ln_fA, ln_fB, ln_fC])

    def predict_mixed_cmc(self, alpha, x, chi):
        """Calculate mixed CMC given bulk mole fractions alpha, micelle composition x, and chi."""
        f = self.activity_coefficients(x, chi)
        cmc_arr = np.array([self.cmc['A'], self.cmc['B'], self.cmc['C']])
        inv_cmc_mix = np.sum(alpha / (f * cmc_arr))
        return 1.0 / inv_cmc_mix

    def calculate_gibbs_free_energy(self, cmc_mix_M, x, chi):
        """Calculate standard and excess Gibbs free energy of micellization (kJ/mol)."""
        f = self.activity_coefficients(x, chi)
        delta_G_ideal = self.R * self.T * np.log(cmc_mix_M)
        delta_G_ex = self.R * self.T * np.sum(x * np.log(f))
        delta_G_total = delta_G_ideal + delta_G_ex
        return {
            "delta_G_total": delta_G_total,
            "delta_G_ideal": delta_G_ideal,
            "delta_G_excess": delta_G_ex
        }

class PerrinFrictionModel:
    """
    Rigid Cylinder Hydrodynamic Friction Factor & Length Inversion Solver
    Based on Broersma (1960) and Perrin (1936) formulations.
    """
    def __init__(self, viscosity_Pa_s=0.89e-3, temperature_K=298.15):
        self.eta = viscosity_Pa_s
        self.T = temperature_K
        self.kB = 1.380649e-23

    def rh_from_diffusivity(self, D_app_m2_s):
        """Stokes-Einstein relation: R_h = k_B * T / (6 * pi * eta * D_app)"""
        return (self.kB * self.T) / (6.0 * np.pi * self.eta * D_app_m2_s)

    def invert_cylinder_length(self, target_Rh_nm, diameter_d_nm=3.2):
        """Broersma asymptotic approximation for rigid cylinder L >> d."""
        def objective(L_nm):
            ratio = diameter_d_nm / L_nm
            denom = np.log(L_nm / diameter_d_nm) + 0.312 + 0.565 * ratio - 0.100 * (ratio**2)
            calc_Rh = (L_nm / 2.0) / denom
            return (calc_Rh - target_Rh_nm)**2

        res = minimize(objective, x0=[1000.0], bounds=[(10.0, 100000.0)], method='L-BFGS-B')
        return float(res.x[0])
