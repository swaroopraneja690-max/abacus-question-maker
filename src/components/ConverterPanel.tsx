import { useRef, useState } from 'react';
import JSZip from 'jszip';
import { convertFile, isSupported, type ConvertibleFile } from '../lib/converter';
import { saveBlob } from '../lib/download';

function outputName(original: string): string {
  return `${original.replace(/\.[^.]+$/, '')}.pdf`;
}

export function ConverterPanel() {
  const [files, setFiles] = useState<ConvertibleFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const accepted = Array.from(incoming)
      .filter(isSupported)
      .map((file) => ({
        file,
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        status: 'pending' as const,
      }));

    const rejected = Array.from(incoming).length - accepted.length;
    setFiles((existing) => [...existing, ...accepted]);
    setMessage(
      rejected > 0
        ? `${rejected} file(s) skipped. Only Word (.docx) and Excel (.xlsx/.xls/.csv) are supported.`
        : `${accepted.length} file(s) added.`,
    );
  };

  const updateStatus = (id: string, status: ConvertibleFile['status'], text?: string) => {
    setFiles((existing) =>
      existing.map((item) =>
        item.id === id ? { ...item, status, message: text } : item,
      ),
    );
  };

  const convertOne = async (item: ConvertibleFile) => {
    updateStatus(item.id, 'pending', 'Converting…');
    try {
      const blob = await convertFile(item.file);
      saveBlob(blob, outputName(item.file.name));
      updateStatus(item.id, 'done', 'Downloaded');
    } catch (error) {
      updateStatus(item.id, 'error', (error as Error).message);
    }
  };

  const convertAll = async () => {
    const pending = files.filter((item) => item.status !== 'done');
    if (pending.length === 0) return;

    setBusy(true);
    const zip = new JSZip();

    for (const item of pending) {
      updateStatus(item.id, 'pending', 'Converting…');
      try {
        const blob = await convertFile(item.file);
        zip.file(outputName(item.file.name), blob);
        updateStatus(item.id, 'done', 'Ready');
      } catch (error) {
        updateStatus(item.id, 'error', (error as Error).message);
      }
    }

    try {
      const archive = await zip.generateAsync({ type: 'blob' });
      saveBlob(archive, 'Converted_PDFs.zip');
      setMessage('All converted PDFs downloaded as a ZIP.');
    } catch (error) {
      setMessage(`Could not create ZIP: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <div
        className={dragging ? 'dropzone dragging' : 'dropzone'}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <strong>Drop Word or Excel files here</strong>
        <span>or click to browse — .docx, .xlsx, .xls, .csv</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".docx,.xlsx,.xls,.csv"
          hidden
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {message && <p className="message">{message}</p>}

      {files.length > 0 && (
        <>
          <table className="file-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {files.map((item) => (
                <tr key={item.id}>
                  <td>{item.file.name}</td>
                  <td>{/\.docx$/i.test(item.file.name) ? 'Word' : 'Excel'}</td>
                  <td className={`status ${item.status}`}>
                    {item.message ?? item.status}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void convertOne(item)}
                    >
                      Convert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="primary" disabled={busy} onClick={() => void convertAll()}>
            {busy ? 'Converting…' : 'Convert all & download ZIP'}
          </button>
        </>
      )}

      <p className="note">
        Conversion runs entirely in this browser. Files are never uploaded anywhere.
        Complex formatting such as macros, charts or exact page breaks may not be preserved.
      </p>
    </div>
  );
}
