import type { CSSProperties } from 'react';
import type { Paper } from '../types';
import { buildBlocks, operandFontPx, sectionCaption } from '../lib/blocks';
import {
  BLOCK_BOTTOM_LINES,
  BLOCK_FIRST_LINES,
  VERTICAL_LINES,
  blockGeometry,
} from '../lib/template';

const SHEET_W = 1079;
const SHEET_H = 612;

const xp = (v: number) => `${(v / SHEET_W) * 100}%`;
const yp = (v: number) => `${(v / SHEET_H) * 100}%`;
const wp = (v: number) => `${(v / SHEET_W) * 100}%`;
const hp = (v: number) => `${(v / SHEET_H) * 100}%`;
const fs = (v: number) => `${(v / SHEET_W) * 100}cqw`;

interface TextOptions {
  size?: number;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

function textStyle(
  x: number,
  baselineY: number,
  { size = 8, bold = false, align = 'left', color = '#111' }: TextOptions = {},
): CSSProperties {
  return {
    position: 'absolute',
    left: xp(x),
    top: yp(baselineY - size * 0.8),
    fontSize: fs(size),
    fontWeight: bold ? 700 : 400,
    color,
    whiteSpace: 'nowrap',
    transform:
      align === 'center'
        ? 'translateX(-50%)'
        : align === 'right'
          ? 'translateX(-100%)'
          : undefined,
    lineHeight: 1,
  };
}

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width?: number;
  color?: string;
}

function GridLine({ x1, y1, x2, y2, width = 0.3, color = '#a5a5a5' }: LineProps) {
  const isVertical = x1 === x2;
  return (
    <div
      className="preview-rule"
      style={
        isVertical
          ? {
              left: xp(x1),
              top: yp(y1),
              height: hp(y2 - y1),
              width,
              background: color,
            }
          : {
              left: xp(x1),
              top: yp(y1),
              width: wp(x2 - x1),
              height: width,
              background: color,
            }
      }
    />
  );
}

interface PreviewProps {
  paper: Paper;
  showAnswers?: boolean;
}

export function Preview({ paper, showAnswers = false }: PreviewProps) {
  const { rule } = paper;
  const gridTop = BLOCK_FIRST_LINES[0];
  const gridBottom = BLOCK_BOTTOM_LINES[3];
  const gridLeft = VERTICAL_LINES[0];
  const gridRight = VERTICAL_LINES[26];
  const blocks = buildBlocks(paper);

  return (
    <div className="paper-sheet-wrap">
      <div className="paper-sheet">
        {/* Header — positioned from the original scan. */}
        <div style={textStyle(31, 26, { size: 8, bold: true })}>COMPULSORY</div>
        <div style={textStyle(45, 30, { size: 12, bold: true })}>ABACUS</div>
        <div style={textStyle(24, 84, { size: 8 })}>Marks per question</div>

        <div style={textStyle(390, 26, { size: 13, bold: true, align: 'center' })}>
          GRADE - {paper.grade}
        </div>
        <div style={textStyle(390, 61, { size: 10, bold: true, align: 'center' })}>
          {rule.headerTitle} -{paper.modelNo}
        </div>
        <div style={textStyle(390, 84, { size: 8, align: 'center' })}>
          Time Limit : {rule.timeMinutes} Minutes&nbsp;&nbsp;&nbsp;(100 Q)
        </div>

        <div style={textStyle(660, 30, { size: 9, bold: true })}>GROUP</div>
        <div style={textStyle(660, 62, { size: 9, bold: true })}>A1&nbsp;&nbsp;&nbsp;A2&nbsp;&nbsp;&nbsp;A3</div>
        <div style={textStyle(745, 30, { size: 9, bold: true })}>TOTAL</div>
        <div style={textStyle(745, 50, { size: 9, bold: true })}>MARKS</div>
        <div style={textStyle(835, 61, { size: 10, bold: true })}>{rule.totalMarks}</div>
        <div style={textStyle(890, 21, { size: 8 })}>Paper Corrector Sign</div>
        <div style={textStyle(890, 61, { size: 8 })}>Data Entry Sign</div>

        {showAnswers && (
          <div style={textStyle(150, 40, { size: 9, bold: true, color: '#b41414' })}>
            ANSWER KEY
          </div>
        )}

        {/* Vertical rules spanning the whole grid. */}
        {VERTICAL_LINES.map((x, index) => (
          <GridLine
            key={`v-${index}`}
            x1={x}
            y1={gridTop}
            x2={x}
            y2={gridBottom}
            width={index === 0 || index === 1 || index === 26 ? 0.7 : 0.3}
            color={index === 0 || index === 1 || index === 26 ? '#464646' : '#a5a5a5'}
          />
        ))}

        {/* Four blocks; each block belongs to a section. */}
        {blocks.map((block, band) => {
          const isMulDiv = block.section.type !== 'addsub';
          const rows = isMulDiv ? 2 : (block.section.rows ?? 3);
          const operandFont = operandFontPx(rows, isMulDiv);
          const geometry = blockGeometry(band, rows, operandFont);

          return (
            <div key={`block-${band}`}>
              {block.isSectionStart && (
                <div
                  className="preview-section-caption"
                  data-section={block.section.type}
                  style={textStyle(24, geometry.firstLine - 12, {
                    size: 9,
                    bold: true,
                    color: '#283c5a',
                  })}
                >
                  {sectionCaption(block.section)}
                </div>
              )}

              <GridLine x1={gridLeft} y1={geometry.firstLine} x2={gridRight} y2={geometry.firstLine} width={0.6} color="#464646" />
              {geometry.operandLines.map((y, index) => (
                <GridLine
                  key={`op-line-${band}-${index}`}
                  x1={gridLeft}
                  y1={y}
                  x2={gridRight}
                  y2={y}
                  width={index === geometry.operandLines.length - 1 ? 0.6 : 0.3}
                  color={index === geometry.operandLines.length - 1 ? '#505050' : '#afafaf'}
                />
              ))}
              <GridLine x1={gridLeft} y1={geometry.bottom} x2={gridRight} y2={geometry.bottom} width={0.7} color="#464646" />

              <div style={textStyle(21, geometry.numberBaseline, { size: 9, bold: true })}>No.</div>
              <div style={textStyle(18, geometry.answerBaseline, { size: 9, bold: true })}>Ans</div>

              {block.questions.map((question, col) => {
                const center = (VERTICAL_LINES[col + 1] + VERTICAL_LINES[col + 2]) / 2;
                const rightEdge = VERTICAL_LINES[col + 2] - 2;
                const number = block.startNumber + col;
                return (
                  <div key={`q-${band}-${col}`}>
                    <div
                      className="preview-number"
                      style={textStyle(center, geometry.numberBaseline, { size: 9, bold: true, align: 'center' })}
                    >
                      {number}
                    </div>
                    {question.lines.map((operand, row) => (
                      <div
                        key={`operand-${band}-${col}-${row}`}
                        className="preview-operand"
                        data-block={band}
                        data-col={col}
                        data-row={row}
                        data-section={block.section.type}
                        style={textStyle(rightEdge, geometry.operandBaselines[row], {
                          size: operandFont,
                          align: 'right',
                        })}
                      >
                        {operand.op ? `${operand.op} ${operand.value}` : operand.value}
                      </div>
                    ))}
                    {showAnswers && (
                      <div style={textStyle(rightEdge, geometry.answerBaseline, { size: 9, bold: true, align: 'right' })}>
                        {question.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
