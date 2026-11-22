/**
 * Geometry measured pixel-by-pixel from the original Grade-1 sample scan
 * (`Level -1 Age - 5 to 10 years.pdf`, 1079 x 612 px), then stretched slightly
 * so every row has enough height for readable operands.
 *
 * The scan is embedded on the A4 landscape page with this matrix:
 *   841.89 0 0 477.51 0 58.88 cm
 * so image pixels map linearly onto the PDF page.
 */
export const PX_W = 1079;
export const PX_H = 612;
export const CONTENT_X = 0;
export const CONTENT_Y = 58.8813;
export const CONTENT_W = 841.8898;
export const CONTENT_H = 477.513;

/** One source pixel maps to this many PDF points. */
export const PX_TO_PT = CONTENT_H / PX_H;

export function fontPt(pixels: number): number {
  return pixels * PX_TO_PT;
}

export function pxX(value: number): number {
  return CONTENT_X + (value / PX_W) * CONTENT_W;
}

export function pxY(value: number): number {
  return CONTENT_Y + (value / PX_H) * CONTENT_H;
}

/** Label column + 25 question columns (27 vertical rules). */
export const VERTICAL_LINES = [
  11, 50, 90, 130, 170, 209, 249, 289, 329, 369, 408, 448, 488, 528, 567,
  607, 647, 687, 727, 766, 806, 846, 886, 926, 965, 1005, 1045,
];

/** First horizontal rule of each block (directly below the question numbers). */
export const BLOCK_FIRST_LINES = [108, 236, 364, 492];
/** Last horizontal rule of each block (below the answer row). */
export const BLOCK_BOTTOM_LINES = [218, 346, 474, 602];

/** Fixed bands inside every block. */
const NUMBER_BAND = 12;
const ANSWER_BAND = 18;
/** Approximate cap height as a fraction of the chosen font size. */
const CAP_RATIO = 0.72;

export interface BlockGeometry {
  /** Baseline Y for question numbers (sits above the first rule). */
  numberBaseline: number;
  /** Horizontal rule below the question numbers. */
  firstLine: number;
  /** Horizontal rules below each operand row. */
  operandLines: number[];
  /** Bottom rule of the block. */
  bottom: number;
  /** Baseline Y for the answer values. */
  answerBaseline: number;
  /** Baseline Y for operand text in each row. */
  operandBaselines: number[];
}

/**
 * Rebuilds a block for any row count. The operand text is centred inside its
 * own row band so larger fonts never cross the horizontal rules.
 */
export function blockGeometry(block: number, rows: number, fontPx: number): BlockGeometry {
  const firstLine = BLOCK_FIRST_LINES[block];
  const bottom = BLOCK_BOTTOM_LINES[block];
  const answerTop = bottom - ANSWER_BAND;
  const step = (answerTop - firstLine) / rows;

  const operandLines = Array.from(
    { length: rows },
    (_, index) => firstLine + (index + 1) * step,
  );

  const capHeight = fontPx * CAP_RATIO;
  const operandBaselines = operandLines.map((_, index) => {
    const rowTop = firstLine + index * step;
    return rowTop + (step + capHeight) / 2;
  });

  return {
    numberBaseline: firstLine - 3,
    firstLine,
    operandLines,
    bottom,
    answerBaseline: bottom - 5,
    operandBaselines,
  };
}
