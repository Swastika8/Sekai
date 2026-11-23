import Markdown from 'react-markdown';

export function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="article-prose">
      <Markdown skipHtml components={{
        h1: 'h2',
        h2: 'h3',
        h3: 'h4',
        img: ({ src, alt, title }) => <img src={src} alt={alt ?? ''} title={title} loading="lazy" />,
      }}>
        {content}
      </Markdown>
    </div>
  );
}

