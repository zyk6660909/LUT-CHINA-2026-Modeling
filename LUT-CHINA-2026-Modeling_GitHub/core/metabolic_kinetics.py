import numpy as np
from scipy.integrate import odeint

class BiBiKineticsODE:
    """
    Coupled ODE Solver for IPTG-Induced Enzyme Expression and
    Ordered Bi-Bi Two-Substrate Enzymatic Glycosylation Cascade.
    """
    def __init__(self, Vmax=5.0, Km_UDP=0.33, Km_Aglycone=1.49):
        self.Vmax = Vmax
        self.Km_A = Km_UDP
        self.Km_B = Km_Aglycone

    def bi_bi_rate(self, UDP_Glc, Aglycone):
        """Ordered Bi-Bi velocity formula."""
        denom = (self.Km_A * Aglycone + self.Km_B * UDP_Glc + UDP_Glc * Aglycone)
        if denom <= 0: return 0.0
        return (self.Vmax * UDP_Glc * Aglycone) / denom

    def simulate(self, t_span, y0=[2.5, 5.0, 0.0]):
        """
        Solve dynamics:
        y[0]: UDP-Glc (mM)
        y[1]: Aglycone (mM)
        y[2]: Glycoside Product (mM)
        """
        def deriv(y, t):
            udp, agly, prod = y
            v = self.bi_bi_rate(max(0, udp), max(0, agly))
            d_udp = -v + 0.35  # Continuous precursor supply from PGM-GalU
            d_agly = -v
            d_prod = v
            return [d_udp, d_agly, d_prod]

        sol = odeint(deriv, y0, t_span)
        return t_span, sol
