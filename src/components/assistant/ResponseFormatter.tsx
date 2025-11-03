import React from 'react';

interface ResponseFormatterProps {
  text: string;
}

export function ResponseFormatter({ text }: ResponseFormatterProps) {
  if (!text) return <p>Click &quot;Get AI Response&quot; to generate content</p>;
  
  try {
    // Pre-process to better split combined elements
    const processedText = preprocessText(text);
    
    // Split by paragraphs
    const rawParagraphs = processedText.split('\n\n');
    
    // Further split paragraphs that contain multiple questions or sections
    const paragraphs = [];
    
    for (const para of rawParagraphs) {
      // If paragraph contains multiple numbered questions, split them
      if (para.match(/\d+[.\)]\s.*?\d+[.\)]/)) {  // Removed the 's' flag
        // Split by digit followed by period or parenthesis
        const parts = para.split(/(?=\d+[\.\)])/);
        paragraphs.push(...parts.filter(p => p.trim()));
      }
      // If paragraph contains multiple lettered sections, split them
      else if (para.match(/[A-Z]\.[\s\S]*?[A-Z]\./) && !para.startsWith('Example')) {
        // Split by capital letter followed by period
        const parts = para.split(/(?=[A-Z]\.)/);
        paragraphs.push(...parts.filter(p => p.trim()));
      } 
      else {
        paragraphs.push(para);
      }
    }
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return null;
          
          const lines = paragraph.split('\n').filter(line => line.trim());
          if (lines.length === 0) return null;
          
          // Check for Roman numeral sections (I., II., III., etc.)
          if (lines[0].match(/^[IVX]+\.\s/)) {
            return (
              <div key={`section-${index}`} className="mb-4">
                <h2 className="text-lg font-semibold mb-2">{lines[0]}</h2>
                <div className="ml-4">
                  {lines.slice(1).map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            );
          }
          
          // Check for alphabetical sections (A., B., C., etc.)
          if (lines[0].match(/^[A-Z]\.\s/)) {
            return (
              <div key={`subsection-${index}`} className="mb-4 ml-4">
                <h3 className="font-semibold mb-2">{lines[0]}</h3>
                <div className="ml-4">
                  {lines.slice(1).map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            );
          }
          
          // Handle numbered questions or study items
          const match = paragraph.match(/^(\d+[\.\)])\s(.+)/);
          if (match) {
            return (
              <div key={`question-${index}`} className="mb-4">
                <p className="mb-2">
                  <span className="font-semibold">{match[1]}</span> {match[2]}
                </p>
              </div>
            );
          }
          
          // Check for multiple numbered items that should form a list
          const numberedLines = lines.filter(line => /^\d+[\.\)]\s/.test(line.trim()));
          if (numberedLines.length >= 2) {
            return (
              <ol key={`ol-${index}`} className="list-decimal list-outside ml-6 mb-4">
                {lines.map((line, i) => {
                  const itemMatch = line.match(/^\d+[\.\)]\s(.+)/);
                  if (itemMatch) {
                    return <li key={i} className="mb-2 pl-2">{itemMatch[1]}</li>;
                  }
                  return <li key={i} className="mb-2 pl-2">{line}</li>;
                })}
              </ol>
            );
          }
          
          // Check for bullet lists
          if (lines.every(line => /^[-*•]\s/.test(line.trim()))) {
            return (
              <ul key={`ul-${index}`} className="list-disc list-outside ml-6 mb-4">
                {lines.map((line, i) => (
                  <li key={i} className="mb-2 pl-2">
                    {line.replace(/^[-*•]\s+/, '')}
                  </li>
                ))}
              </ul>
            );
          }
          
          // Handle markdown headings
          if (lines[0].trim().startsWith('# ')) {
            return (
              <h1 key={`h1-${index}`} className="text-2xl font-bold mt-6 mb-4">
                {lines[0].replace(/^#\s+/, '')}
              </h1>
            );
          } else if (lines[0].trim().startsWith('## ')) {
            return (
              <h2 key={`h2-${index}`} className="text-xl font-bold mt-5 mb-3">
                {lines[0].replace(/^##\s+/, '')}
              </h2>
            );
          } else if (lines[0].trim().startsWith('### ')) {
            return (
              <h3 key={`h3-${index}`} className="text-lg font-bold mt-4 mb-2">
                {lines[0].replace(/^###\s+/, '')}
              </h3>
            );
          }
          
          // Default: treat as regular paragraph
          return (
            <p 
              key={`p-${index}`} 
              className="mb-4"
              dangerouslySetInnerHTML={{ 
                __html: processMarkdown(lines.join(' ')) 
              }}
            />
          );
        })}
      </div>
    );
  } catch (e) {
    console.error("Error formatting response:", e);
    // Fallback to pre-formatted text if parsing fails
    return <pre className="whitespace-pre-wrap">{text}</pre>;
  }
}

// Pre-processing function to split combined elements
const preprocessText = (text: string) => {
  // Enhanced version that separates numbered questions and lettered sections
  let processed = text.replace(/(\d+[\.\)]\s[^.]+?)\s+(\d+[\.\)])/g, '$1\n\n$2');
  processed = processed.replace(/([A-Z]\.(?:\s[^.]+?(?:\.\s|\.$)))\s+([A-Z]\.)/g, '$1\n\n$2');
  processed = processed.replace(/([IVX]+\.(?:\s[^.]+?(?:\.\s|\.$)))\s+([IVX]+\.)/g, '$1\n\n$2');
  return processed;
};

// Process markdown inline formatting
const processMarkdown = (text: string) => {
  let processed = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');
  processed = processed.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
  return processed;
};