import NewsCard from '../components/NewsCard'

const sample = [
  {source:'Bloomberg', title:'SBER Rises on Strong Earnings', snippet:'Sberbank shares gained after Q3 profit...', url:'#'},
  {source:'Reuters', title:'Sberbank Posts 12% Profit Growth', snippet:'Sberbank reported a 12% year-on-year increase...', url:'#'},
  {source:'TradingView', title:'SBER: Bullish Divergence', snippet:'Technical analysis shows a bullish divergence...', url:'#'},
]

export default function News(){
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {sample.map((n,i)=>(<NewsCard key={i} {...n} />))}
    </div>
  )
}