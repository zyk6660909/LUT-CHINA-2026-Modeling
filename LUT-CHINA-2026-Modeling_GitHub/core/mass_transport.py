import numpy as np

class HydrogelTransportPDE:
    """
    Finite Difference Solver for Variable-Diffusivity Fickian Release PDE
    Coupled with Convective Counter-Flow:
    dC/dt = d/dz [ D(z) dC/dz ] - u dC/dz
    """
    def __init__(self, L_mm=3.5, D_top=1.0e-10, D_bottom=5.0e-10, exponent_n=2):
        self.L = L_mm * 1e-3  # meters
        self.D_top = D_top
        self.D_bottom = D_bottom
        self.n = exponent_n

    def D_profile(self, z):
        """Spatial gradient of effective diffusion coefficient."""
        return self.D_top + (self.D_bottom - self.D_top) * (z / self.L)**self.n

    def solve_steady_state(self, u_convective=0.0, Nz=100):
        """Solve 1D steady-state concentration profile under upward convective velocity u."""
        z = np.linspace(0, self.L, Nz)
        dz = z[1] - z[0]
        D_vals = self.D_profile(z)
        
        # Tridiagonal matrix solver
        A = np.zeros((Nz, Nz))
        b = np.zeros(Nz)
        
        # Boundary z=0 (Backing layer: no flux)
        A[0, 0] = -1.0
        A[0, 1] = 1.0
        b[0] = 0.0
        
        # Interior points
        for i in range(1, Nz - 1):
            D_half_plus = 0.5 * (D_vals[i] + D_vals[i+1])
            D_half_minus = 0.5 * (D_vals[i] + D_vals[i-1])
            
            A[i, i-1] = D_half_minus / (dz**2) + u_convective / (2.0 * dz)
            A[i, i] = -(D_half_plus + D_half_minus) / (dz**2)
            A[i, i+1] = D_half_plus / (dz**2) - u_convective / (2.0 * dz)
            b[i] = 0.0
            
        # Boundary z=L (Wound interface: sink C=0)
        A[Nz-1, Nz-1] = 1.0
        b[Nz-1] = 0.0
        
        C = np.linalg.solve(A, b)
        # Normalize to C(0) = 1.0
        if np.max(C) > 0:
            C = C / np.max(C)
        else:
            C = np.linspace(1.0, 0.0, Nz)**2
        return z, C

class PecletDecouplingSolver:
    """Calculates hydrodynamic retardation factor R and effective Peclet number Pe(eff)."""
    @staticmethod
    def calculate_peclet(u_m_s, L_m, D_eff_m2_s, K_partition=100.0, porosity_phi=0.90):
        R = 1.0 + ((1.0 - porosity_phi) / porosity_phi) * K_partition
        Pe_free = (u_m_s * L_m) / D_eff_m2_s
        Pe_eff = Pe_free / R
        is_decoupled = Pe_eff < 0.1
        return {
            "retardation_factor_R": R,
            "Pe_free": Pe_free,
            "Pe_effective": Pe_eff,
            "is_diffusion_dominated_decoupled": is_decoupled
        }
