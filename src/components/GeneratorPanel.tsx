import { useState } from 'react';
import { LEVELS, getLevel } from '../config/levels';
import { buildPapersZip, fileName, saveBlob } from '../lib/download';
import { paperToExcelBlob } from '../lib/excel';
import { generatePapers } from '../lib/generator';
import { paperToPdfBlob } from '../lib/pdf';
import { randomSeed } from '../lib/random';
import type { Paper } from '../types';
import { Preview } from './Preview';

export function GeneratorPanel() {
  const [grade, setGrade] = useState(1);
  const [count, setCount] = useState(1);
  const [seedText, setSeedText] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const rule = getLevel(grade);

  const handleGenerate = () => {
    const parsedSeed = seedText.trim() === '' ? randomSeed() : Number(seedText);
    const seed = Number.isFinite(parsedSeed) ? parsedSeed >>> 0 : randomSeed();
    const generated = generatePapers(rule, Math.max(1, Math.min(20, count)), seed);
    setPapers(generated);
    setSelected(0);
    setMessage(`Ready — ${generated.length} paper${generated.length > 1 ? 's' : ''} generated for ${rule.label}.`);
  };

  const current = papers[selected];

  const downloadQuestionPdf = (paper: Paper) =>
    saveBlob(paperToPdfBlob(paper, false), fileName(paper, 'Question', 'pdf'));

  const downloadAnswerPdf = (paper: Paper) =>
    saveBlob(paperToPdfBlob(paper, true), fileName(paper, 'AnswerKey', 'pdf'));

  const downloadExcel = async (paper: Paper) => {
    saveBlob(await paperToExcelBlob(paper, false), fileName(paper, 'Question', 'xlsx'));
  };

  const downloadAll = async () => {
    if (papers.length === 0) return;
    setBusy(true);
    setMessage('Preparing your ZIP…');
    try {
      saveBlob(await buildPapersZip(papers), `Abacus_Grade_${grade}_Papers.zip`);
      setMessage('Downloaded. Each paper includes question PDF, answer PDF and Excel file.');
    } catch (error) {
      setMessage(`Could not build ZIP: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="generator-layout">
      <aside className="settings-card">
        <div className="card-heading">
          <span className="heading-icon">✦</span>
          <div>
            <h2>Paper settings</h2>
            <p>Choose a level and how many papers you need.</p>
          </div>
        </div>

        <label className="field-label">Level</label>
        <div className="grade-grid">
          {LEVELS.map((level) => (
            <button
              type="button"
              key={level.grade}
              className={`grade-chip ${grade === level.grade ? 'active' : ''}`}
              onClick={() => setGrade(level.grade)}
            >
              <span>{level.grade}</span>
            </button>
          ))}
        </div>

        <div className="rule-summary">
          <div><span>Questions</span><strong>100</strong></div>
          <div><span>Time</span><strong>{rule.timeMinutes} min</strong></div>
          <div><span>Marks</span><strong>{rule.totalMarks}</strong></div>
          <div><span>Sections</span><strong>{rule.sections.length}</strong></div>
        </div>
        <div className="section-list">
          {rule.sections.map((section, index) => (
            <div key={index} className="section-item">
              <span className={`section-dot ${section.type}`} />
              <div>
                <strong>{section.type === 'addsub' ? 'Addition & Subtraction' : section.type === 'multiplication' ? 'Multiplication' : 'Division'}</strong>
                <small>{section.caption} · {section.count} Q</small>
              </div>
            </div>
          ))}
        </div>

        <label className="field-label" htmlFor="paper-count">Number of papers</label>
        <div className="stepper">
          <button type="button" onClick={() => setCount((value) => Math.max(1, value - 1))}>−</button>
          <input
            id="paper-count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
          <button type="button" onClick={() => setCount((value) => Math.min(20, value + 1))}>+</button>
        </div>

        <label className="field-label" htmlFor="seed">Seed <em>(optional)</em></label>
        <input
          id="seed"
          className="text-input"
          type="text"
          placeholder="Leave blank for random"
          value={seedText}
          onChange={(event) => setSeedText(event.target.value)}
        />

        <button type="button" className="generate-button" onClick={handleGenerate}>
          <span>⚡</span> Generate question papers
        </button>

        {message && <p className="message">{message}</p>}
      </aside>

      <section className="preview-card">
        {!current ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Your paper will appear here</h3>
            <p>Pick a level, then click “Generate question papers”.</p>
          </div>
        ) : (
          <>
            <div className="preview-toolbar">
              <div className="model-tabs">
                {papers.map((paper, index) => (
                  <button
                    type="button"
                    key={`${paper.seed}-${index}`}
                    className={index === selected ? 'active' : ''}
                    onClick={() => setSelected(index)}
                  >
                    Model {paper.modelNo}
                  </button>
                ))}
              </div>

              <div className="preview-actions">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showAnswers}
                    onChange={(event) => setShowAnswers(event.target.checked)}
                  />
                  <span>Show answers</span>
                </label>
                <button type="button" onClick={() => downloadQuestionPdf(current)}>Question PDF</button>
                <button type="button" onClick={() => downloadAnswerPdf(current)}>Answer PDF</button>
                <button type="button" onClick={() => void downloadExcel(current)}>Excel</button>
                <button type="button" className="accent" disabled={busy} onClick={() => void downloadAll()}>
                  {busy ? 'Preparing…' : 'Download all ↓'}
                </button>
              </div>
            </div>

            <Preview paper={current} showAnswers={showAnswers} />
          </>
        )}
      </section>
    </div>
  );
}
