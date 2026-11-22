import JSZip from 'jszip';
import type { Paper } from '../types';
import { paperToExcelBlob } from './excel';
import { paperToPdfBlob } from './pdf';

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function fileName(paper: Paper, suffix: string, extension: string): string {
  return `Grade_${paper.grade}_Model_${paper.modelNo}_${suffix}.${extension}`;
}

export async function buildPapersZip(
  papers: Paper[],
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  let done = 0;

  for (const paper of papers) {
    const folderName = `Grade_${paper.grade}_Model_${paper.modelNo}`;
    const folder = zip.folder(folderName)!;

    folder.file(
      fileName(paper, 'Question', 'pdf'),
      paperToPdfBlob(paper, false),
    );
    folder.file(
      fileName(paper, 'AnswerKey', 'pdf'),
      paperToPdfBlob(paper, true),
    );
    folder.file(
      fileName(paper, 'Question', 'xlsx'),
      await paperToExcelBlob(paper, false),
    );

    done += 1;
    onProgress?.(done, papers.length);
  }

  return zip.generateAsync({ type: 'blob' });
}
