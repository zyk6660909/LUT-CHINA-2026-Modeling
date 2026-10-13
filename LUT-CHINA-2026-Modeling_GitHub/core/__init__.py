"""
LUT-CHINA 2026 Multi-Scale Modeling Core Toolkit
================================================
A modular, reusable, and reproducible computational biology library for:
- Supramolecular ternary micellar thermodynamics (Holland-Rubingh model)
- Perrin hydrodynamic cylinder friction inversion
- Hydrogel mass transport & Péclet number decoupling PDE solver
- Bi-plasmid metabolic flux & ordered Bi-Bi enzyme kinetics
- Wound contraction dual-target PK/PD dynamics
"""

from .micelle_assembly import HollandRubinghModel, PerrinFrictionModel
from .mass_transport import HydrogelTransportPDE, PecletDecouplingSolver
from .metabolic_kinetics import BiBiKineticsODE
from .wound_pkpd import WoundContractionModel

__version__ = "1.0.0"
__author__ = "LUT-CHINA 2026 iGEM Modeling Team"
