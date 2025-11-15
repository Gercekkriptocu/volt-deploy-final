// 90'lar tarzı retro ses efektleri
export const playRetroSound = {
  // Coin sesi - deploy edildiğinde çalacak
  coin: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Coin ses efekti - daha uzun ve güçlü yükselen ton
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.15) // C6
      
      // Daha yumuşak ses seviyesi
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.25)
      
      // İkinci bir ton ekle (echo effect) - daha yumuşak
      setTimeout(() => {
        try {
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          
          osc2.connect(gain2)
          gain2.connect(audioContext.destination)
          
          osc2.type = 'sine'
          osc2.frequency.setValueAtTime(1046.50, audioContext.currentTime)
          gain2.gain.setValueAtTime(0.08, audioContext.currentTime)
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
          
          osc2.start(audioContext.currentTime)
          osc2.stop(audioContext.currentTime + 0.2)
        } catch (e) {
          // Ignore echo error
        }
      }, 100)
    } catch (error) {
      console.error('Ses çalma hatası:', error)
    }
  },
  
  // Geçiş sesi - kontrat değiştiğinde çalacak
  switch: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Kısa blip sesi
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch (error) {
      console.error('Ses çalma hatası:', error)
    }
  }
}
