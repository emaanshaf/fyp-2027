import React from 'react';
import { Text } from 'react-native';

// Renders plain text with **bold** spans, since the AI knowledge base and
// Claude responses use minimal markdown but chat bubbles are plain RN <Text>.
export default function FormattedText({ text, style, boldStyle }) {
  const parts = (text || '').split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        const isBold = part.startsWith('**') && part.endsWith('**');
        return (
          <Text key={i} style={isBold ? [{ fontWeight: '800' }, boldStyle] : undefined}>
            {isBold ? part.slice(2, -2) : part}
          </Text>
        );
      })}
    </Text>
  );
}
