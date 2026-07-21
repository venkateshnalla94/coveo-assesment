/* eslint-disable @next/next/no-img-element */
import {
  File,
  FileSpreadsheet,
  FileText,
  Globe2,
  Presentation,
  type LucideIcon,
} from "lucide-react";

type ResultCardProps = {
  clickUri: string;
  dateLabel?: string;
  excerpt?: string;
  meta: string[];
  onSelect?: () => void;
  printableUri: string;
  resultType: string;
  tags: string[];
  thumbnail?: string;
  title: string;
};

const resultTypeIcons: Record<string, LucideIcon> = {
  Excel: FileSpreadsheet,
  PDF: FileText,
  PowerPoint: Presentation,
  "Web Page": Globe2,
  Word: FileText,
};

export function ResultCard({
  clickUri,
  dateLabel,
  excerpt,
  meta,
  onSelect,
  printableUri,
  resultType,
  tags,
  thumbnail,
  title,
}: ResultCardProps) {
  const ResultTypeIcon = resultTypeIcons[resultType] ?? File;

  return (
    <article className="result-item">
      <div className="result-body">
        <div className="result-kicker">
          <span className="result-type">
            <ResultTypeIcon aria-hidden="true" size={17} />
            {resultType}
          </span>
        </div>

        <a
          className="result-title"
          href={clickUri}
          onClick={onSelect}
          onContextMenu={onSelect}
          onMouseDown={onSelect}
          rel="noreferrer"
          target="_blank"
        >
          <span>{title}</span>
        </a>

        <div className="result-source-line">
          <span>{printableUri}</span>
          {meta.length > 0 ? <span>{meta.join(" / ")}</span> : null}
        </div>

        {excerpt ? <p className="result-excerpt">{excerpt}</p> : null}

        {tags.length > 0 ? (
          <ul className="result-tags" aria-label="Result tags">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="result-preview" aria-hidden="true">
        {thumbnail ? (
          <img alt="" className="result-thumbnail" loading="lazy" src={thumbnail} />
        ) : (
          <span>{resultType}</span>
        )}
      </div>

      {dateLabel ? <time className="result-date">{dateLabel}</time> : null}
    </article>
  );
}
