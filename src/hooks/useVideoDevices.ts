import { useState, useEffect } from 'react'

export interface VideoDevice {
  deviceId: string
  label: string
}

export function useVideoDevices() {
  const [devices, setDevices] = useState<VideoDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')

  useEffect(() => {
    // Não pede permissão própria — o useCamera já pede; labels aparecem via devicechange
    const enumerate = () => {
      navigator.mediaDevices.enumerateDevices().then(all => {
        const videoInputs = all
          .filter(d => d.kind === 'videoinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Câmera ${d.deviceId.slice(0, 6)}`,
          }))
        setDevices(videoInputs)
      }).catch(() => {})
    }

    enumerate()
    // Re-enumera após pequena espera para pegar labels após permissão concedida pelo useCamera
    const t1 = setTimeout(enumerate, 800)
    const t2 = setTimeout(enumerate, 2500)

    navigator.mediaDevices.addEventListener('devicechange', enumerate)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      navigator.mediaDevices.removeEventListener('devicechange', enumerate)
    }
  }, [])

  return { devices, selectedDeviceId, setSelectedDeviceId }
}
