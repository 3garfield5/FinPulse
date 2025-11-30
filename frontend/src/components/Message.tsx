// src/components/Message.tsx
import React from "react";

type Props = {
  id: number;
  author: string;
  text: string;
  time: string;
  isBot: boolean;
};

export default function Message({ author, text, time, isBot }: Props) {
  const wrapperAlign = isBot ? "justify-start" : "justify-end";
  const bubbleBg = isBot ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white";

  return (
    <div className={`flex ${wrapperAlign}`}>
      <div className={`max-w-xl rounded-lg px-3 py-2 ${bubbleBg}`}>
        <div className="text-xs opacity-70 mb-1">
          {author} • {time}
        </div>
        <div className="text-sm whitespace-pre-wrap">{text}</div>
      </div>
    </div>
  );
}
