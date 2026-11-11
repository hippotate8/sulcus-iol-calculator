/** Port of the formulas in Database!A4:BH6, Sulcus IOL Calculator v1.05. */
export const MODELS = {
  za9003: {
    label: 'TECNIS ZA9003',
    modified: { a0: 9.505, a1: -0.129, a2: 0.378, a3: -1.787 },
    original: { a0: -1.298, a1: 0.233, a2: 0.240 }
  },
  ar40e: {
    label: 'SENSAR AR40E',
    modified: { a0: 9.066, a1: -0.186, a2: 0.308, a3: -1.514 },
    original: { a0: -2.420, a1: 0.157, a2: 0.288 }
  },
  other: {
    label: 'Other IOL',
    modified: { a0: 9.505, a1: -0.129, a2: 0.378, a3: -1.787 },
    original: { a0: -1.298, a1: 0.233, a2: 0.240 }
  }
};

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const roundHalf = (x) => Math.round(x * 2) / 2;

export function calculate(input, constants = MODELS.za9003) {
  const { al, k1, k2, acd, target, iol } = input;
  if (![al, k1, k2, acd, target].every(Number.isFinite)) {
    throw Error('AL, K1, K2, ACD, Target Refraction을 모두 입력해 주세요.');
  }
  if (al < 15 || al > 40 || k1 < 30 || k1 > 60 || k2 < 30 || k2 > 60 || acd < 1 || acd > 7 || target < -15 || target > 15) {
    throw Error('입력값을 확인하세요. 일반적인 측정 범위를 벗어났습니다.');
  }

  const k = (k1 + k2) / 2;
  const R = 337.5 / k;
  const Zd = 331.5 / R + target / (1 - 0.012 * target);

  function powerForTarget(elp) {
    return 1336 / (al - elp) - 1.336 / (1.336 / Zd - elp / 1000);
  }

  function predictedRefraction(power, elp) {
    const z = (1336 * (1336 - power * (al - elp))) / (1336 * al - power * elp * (al - elp));
    const d = z - 331.5 * k / 337.5;
    return d / (1 + 0.012 * d);
  }

  function model(elp) {
    if (!Number.isFinite(elp) || elp <= 0 || elp >= al - 0.5) {
      throw Error('계산된 ELP가 유효하지 않습니다. 상수와 입력값을 확인하세요.');
    }
    const ideal = powerForTarget(elp);
    if (!Number.isFinite(ideal)) throw Error('계산 중 오류가 발생했습니다.');

    const top = Math.floor(ideal) + Math.floor((ideal - Math.floor(ideal)) * 2) / 2 + 2;
    const table = Array.from({ length: 8 }, (_, j) => {
      const power = top - 0.5 * j;
      return { power, refraction: round2(predictedRefraction(power, elp)) };
    });

    const roundedIdealPower = roundHalf(ideal);
    const recommended = table.reduce((best, row) => {
      const diff = Math.abs(row.refraction - target);
      return diff < best.diff ? { ...row, diff } : best;
    }, { power: roundedIdealPower, refraction: round2(predictedRefraction(roundedIdealPower, elp)), diff: Math.abs(predictedRefraction(roundedIdealPower, elp) - target) });

    return {
      elp,
      ideal,
      roundedIdealPower,
      recommendedPower: recommended.power,
      recommendedRefraction: recommended.refraction,
      table,
      atSelected: Number.isFinite(iol) ? predictedRefraction(iol, elp) : null
    };
  }

  const m = constants.modified;
  const o = constants.original;
  const modified = model(m.a0 + m.a1 * acd + m.a2 * al + m.a3 * R);
  const original = model(o.a0 + o.a1 * acd + o.a2 * al + 11.13 - 1.55 * R);
  return { k, R, modified, original };
}
