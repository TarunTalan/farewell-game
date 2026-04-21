let threeRef = null

export async function loadThree() {
  if (window.THREE) {
    threeRef = window.THREE
    return threeRef
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
    script.onload = () => {
      threeRef = window.THREE
      resolve()
    }
    script.onerror = reject
    document.head.appendChild(script)
  })

  return threeRef
}
