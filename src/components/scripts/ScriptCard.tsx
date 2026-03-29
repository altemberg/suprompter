import { useNavigate } from 'react-router-dom'
import type { Script } from '@/types'

interface ScriptCardProps {
  script: Script
}

export function ScriptCard({ script }: ScriptCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/roteiros/${script.id}`)}
      className="bg-[#161616] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.12] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
    >
      <p className="text-[13.5px] font-medium text-white/85 truncate mb-2">{script.title}</p>
      <div className="flex gap-2 items-center">
        {script.format === 'reels' ? (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(127,119,221,0.15)] text-[#a9a3f0] border border-[rgba(127,119,221,0.2)]">Reels</span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[rgba(29,158,117,0.15)] text-[#4ecda4] border border-[rgba(29,158,117,0.2)]">YouTube</span>
        )}
        <span className="text-[12px] text-white/30">{script.tone}</span>
      </div>
    </div>
  )
}
