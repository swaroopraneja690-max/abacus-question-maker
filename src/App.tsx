import { useState } from 'react';
import { ConverterPanel } from './components/ConverterPanel';
import { GeneratorPanel } from './components/GeneratorPanel';

type Tab = 'generate' | 'convert';

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Abacus Question Paper Maker</h1>
          <p>Generate random question papers with answer keys, and convert files to PDF — locally.</p>
        </div>
        <div className="badge">100% offline</div>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={tab === 'generate' ? 'active' : ''}
          onClick={() => setTab('generate')}
        >
          Question paper generator
        </button>
        <button
          type="button"
          className={tab === 'convert' ? 'active' : ''}
          onClick={() => setTab('convert')}
        >
          Word / Excel → PDF
        </button>
      </nav>

      <main>{tab === 'generate' ? <GeneratorPanel /> : <ConverterPanel />}</main>

      <footer className="app-footer">
        Runs on this computer only. No files are uploaded to the internet.
      </footer>
    </div>
  );
}
