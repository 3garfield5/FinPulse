import React from "react"

type MessageProps = {
  author: string
  text: string
  time: string
  isBot: boolean
}

export default function Message({author, text, time, isBot}: MessageProps){
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`${isBot ? 'bg-white border' : 'bg-blue-600 text-white'} max-w-[70%] p-3 rounded-lg shadow-sm`}>
        <div className="text-xs text-black-500 mb-1">{author} • {time}</div>
        <div className="text-sm">{text}</div>
      </div>
    </div>
  )
}