# API Contract Verification Skill - Benchmark Results

## Summary

| Configuration     | Pass Rate       | Duration    |
| ----------------- | --------------- | ----------- |
| **with_skill**    | 86.7% ± 23.1%   | 497s ± 107s |
| **without_skill** | 53.3% ± 30.6%   | 450s ± 73s  |
| **Delta**         | +33.3% (+62.5%) | +47s        |

## Per-Eval Breakdown

### Eval 1: explicit-api-integration

| Config        | Pass Rate | Passed | Duration |
| ------------- | --------- | ------ | -------- |
| with_skill    | **100%**  | 5/5    | 529s     |
| without_skill | 20%       | 1/5    | 535s     |
| **Delta**     | +80%      | +4     | -6s      |

**Key difference**: Skill enforced Swagger/Controller reading, wrapper schema definition, and self-test verification. Baseline skipped contract discovery.

### Eval 2: feature-with-backend-data

| Config        | Pass Rate | Passed | Duration |
| ------------- | --------- | ------ | -------- |
| with_skill    | **100%**  | 5/5    | 587s     |
| without_skill | 60%       | 3/5    | 426s     |
| **Delta**     | +40%      | +2     | +161s    |

**Key difference**: Skill enforced reading backend DB schema + creating full backend API stack. Baseline assumed endpoints without verification.

### Eval 3: api-error-debugging

| Config        | Pass Rate | Passed | Duration |
| ------------- | --------- | ------ | -------- |
| with_skill    | 60%       | 3/5    | 375s     |
| without_skill | **80%**   | 4/5    | 390s     |
| **Delta**     | -20%      | -1     | -15s     |

**Key difference**: Skill missed double-toast assertion; baseline addressed error extraction correctly but also missed toast handling.

## Analyst Observations

1. **Strong improvement on contract-heavy tasks**: The skill excels when API contract verification is critical (explicit-api-integration, feature-with-backend-data).

2. **Over-constraining on simple fixes**: For api-error-debugging (a focused error handling fix), the skill's workflow may be overkill, causing slight regression.

3. **Key differentiator**: `mentions_swagger_or_controller` assertion shows 100% pass with skill vs 0% without — this is the skill's core value.

4. **Self-test gap**: Both configurations struggled with `mentions_self_test` assertion — neither actually called endpoints during implementation.

## Recommendations

1. Keep the skill for new API integrations (high value)
2. Consider relaxing Phase 4 (self-test) for quick fixes where endpoint testing is impractical
3. Add explicit guidance on when to skip phases (e.g., "for error handling fixes, Phase 1 may be abbreviated")
