import React from "react"

type NewsCardProps = {
  source: string
  title: string
  snippet: string
  url: string
}

export default function NewsCard({source, title, snippet, url}: NewsCardProps){
  return (
    <article className="bg-white p-4 rounded shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-gray-500">{source}</p>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Источник</a>
      </div>
      <p className="mt-2 text-gray-700 text-sm">{snippet}</p>
    </article>
  )
}