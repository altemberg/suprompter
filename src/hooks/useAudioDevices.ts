import { useState, useEffect } from 'react'

export interface AudioDevice {
  deviceId: string
  label: string
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')

  useEffect(() => {
    // Pede permissão de áudio antes de listar — necessário para obter labels no iOS/Safari
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then(all => {
        const audioInputs = all
          .filter(d => d.kind === 'audioinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Microfone ${d.deviceId.slice(0, 6)}`,
          }))
        setDevices(audioInputs)
      })
      .catch(() => {}) // permissão negada — sem dispositivos

    // Atualiza lista se dispositivo for conectado/desconectado
    const handler = () => {
      navigator.mediaDevices.enumerateDevices().then(all => {
        const audioInputs = all
          .filter(d => d.kind === 'audioinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `Microfone ${d.deviceId.slice(0, 6)}`,
          }))
        setDevices(audioInputs)
      })
    }

    navigator.mediaDevices.addEventListener('devicechange', handler)
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler)
  }, [])

  return { devices, selectedDeviceId, setSelectedDeviceId }
}
