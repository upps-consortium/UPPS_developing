# UPPS Persona Library

This directory collects example persona files and templates for the Unified Personality Profile Standard (UPPS).
Persona data is separated by domain and continually expanded with new medical resources.

For guidance on extending emotion sets, see [additional emotion recommendations](../specification/additional_emotions_recommendations.md).

## Directory Overview

```
persona_lib/
├── rachel_bladerunner.yaml   # Sample persona from film
├── lum_urusei_yatsura.yaml   # Sample persona from anime
├── original_characters/      # UPPS original character personas
├── medical/                  # Medical patient personas and symptom templates (e.g., schizophrenia, delusional disorder)
```

The `medical` folder includes disease-specific symptom templates and educational patient personas.

### Medical content summary

| Resource | Count | Reference |
|----------|------|-----------|
| Disorder templates | 31 directories | [medical/templates/README.md](medical/templates/README.md) |
| Patient personas | 32 YAML files | [medical/examples/README.md](medical/examples/README.md) |

See [medical/README.md](medical/README.md) for a full overview.

#### Covered disorders (ICD‑11 order)

1. Attention Deficit Hyperactivity Disorder
2. Autism Spectrum Disorder
3. Schizophrenia
4. Delusional Disorder
5. Bipolar Disorder
6. Depressive Disorder
7. Persistent Depressive Disorder
8. Generalized Anxiety Disorder
9. Panic Disorder
10. Specific Phobia
11. Social Anxiety Disorder
12. Obsessive-Compulsive Disorder
13. Body Dysmorphic Disorder
14. Hoarding Disorder
15. Post-Traumatic Stress Disorder
16. Acute Stress Reaction
17. Adjustment Disorder
18. Dissociative Identity Disorder
19. Depersonalization/Derealization Disorder
20. Anorexia Nervosa
21. Bulimia Nervosa
22. Binge Eating Disorder
23. Somatic Symptom Disorder
24. Illness Anxiety Disorder
25. Alcohol Use Disorder
26. Opioid Use Disorder
27. Gambling Disorder
28. Antisocial Personality Disorder
29. Borderline Personality Disorder
30. Avoidant Personality Disorder
31. Alzheimer's Disease
