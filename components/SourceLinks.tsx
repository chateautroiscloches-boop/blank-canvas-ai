
import React from 'react';
import { GroundingChunk } from '../types';

interface SourceLinksProps {
  sources?: GroundingChunk[];
}

const SourceLinks: React.FC<SourceLinksProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const validSources = sources.filter(s => s.web && s.web.uri && s.web.title);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold text-text-secondary mb-2">Sources:</h4>
      <ul className="list-disc list-inside space-y-1">
        {validSources.map((source, index) => (
          <li key={index} className="text-sm">
            <a
              href={source.web!.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark hover:underline"
            >
              {source.web!.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceLinks;